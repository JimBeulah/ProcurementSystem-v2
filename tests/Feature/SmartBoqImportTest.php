<?php

namespace Tests\Feature;

use App\Services\BoqColumnMapper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SmartBoqImportTest extends TestCase
{
    use RefreshDatabase;

    // --- BoqColumnMapper unit tests ---

    public function test_maps_exact_description_header()
    {
        $mapper = new BoqColumnMapper();
        $result = $mapper->map(['ITEM DESCRIPTION', 'UNIT', 'QTY', 'UNIT COST']);

        $this->assertEquals('itemDescription', $result[0]['mappedTo']);
        $this->assertEquals('high', $result[0]['confidence']);
    }

    public function test_maps_partial_match_with_low_confidence()
    {
        $mapper = new BoqColumnMapper();
        $result = $mapper->map(['DESCRIPTION OF WORK']);

        $this->assertEquals('itemDescription', $result[0]['mappedTo']);
        $this->assertEquals('low', $result[0]['confidence']);
    }

    public function test_returns_null_for_unrecognized_header()
    {
        $mapper = new BoqColumnMapper();
        $result = $mapper->map(['REMARKS']);

        $this->assertNull($result[0]['mappedTo']);
        $this->assertNull($result[0]['confidence']);
    }

    public function test_maps_qty_abbreviation()
    {
        $mapper = new BoqColumnMapper();
        $result = $mapper->map(['QTY.']);

        $this->assertEquals('quantity', $result[0]['mappedTo']);
    }

    public function test_maps_multiple_headers_returns_correct_count()
    {
        $mapper = new BoqColumnMapper();
        $headers = ['ITEM DESCRIPTION', 'UOM', 'QTY', 'MATERIAL COST', 'LABOR COST', 'TOTAL', 'REMARKS'];
        $result = $mapper->map($headers);

        $this->assertCount(7, $result);
        $this->assertEquals(0, $result[0]['columnIndex']);
        $this->assertEquals(6, $result[6]['columnIndex']);
    }

    public function test_map_result_contains_original_header()
    {
        $mapper = new BoqColumnMapper();
        $result = $mapper->map(['SCOPE OF WORKS']);

        $this->assertEquals('SCOPE OF WORKS', $result[0]['originalHeader']);
    }

    // --- SmartBoqImportController feature tests ---

    private function makeAdminWithProject(): array
    {
        $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
        $user = \App\Models\User::factory()->create(['role' => 'admin']);
        $user->assignRole('admin');
        $client = \App\Models\Client::factory()->create();
        $project = \App\Models\Project::factory()->create([
            'client_id' => $client->id,
            'status' => 'PLANNING',
            'approved_by' => null,
        ]);
        return [$user, $project];
    }

    public function test_analyze_rejects_non_excel_file()
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        [$user, $project] = $this->makeAdminWithProject();

        $file = \Illuminate\Http\UploadedFile::fake()->create('test.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user)
            ->postJson("/projects/{$project->id}/boq/smart-import/analyze", [
                'file' => $file,
            ]);

        $response->assertStatus(422);
    }

    public function test_confirm_saves_boq_items_using_confirmed_mappings()
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        [$user, $project] = $this->makeAdminWithProject();

        $token = \Illuminate\Support\Str::uuid()->toString();
        $rows = [
            ['Concreting Works', 'lot', '1', '12500', '3000'],
            ['Masonry Works', 'sqm', '45', '8200', '1500'],
        ];
        \Illuminate\Support\Facades\Storage::put("boq_imports/{$token}.json", json_encode($rows));

        $mappings = [
            ['columnIndex' => 0, 'mappedTo' => 'itemDescription'],
            ['columnIndex' => 1, 'mappedTo' => 'unit'],
            ['columnIndex' => 2, 'mappedTo' => 'quantity'],
            ['columnIndex' => 3, 'mappedTo' => 'materialUnitCost'],
            ['columnIndex' => 4, 'mappedTo' => 'laborUnitCost'],
        ];

        $response = $this->actingAs($user)
            ->post("/projects/{$project->id}/boq/smart-import/confirm", [
                'token'    => $token,
                'mappings' => $mappings,
            ]);

        $response->assertStatus(302);
        $this->assertDatabaseHas('boq_items', [
            'item_description' => 'Concreting Works',
            'project_id'       => $project->id,
        ]);
        $this->assertDatabaseHas('boq_items', ['item_description' => 'Masonry Works']);
        \Illuminate\Support\Facades\Storage::assertMissing("boq_imports/{$token}.json");
    }

    public function test_mapper_finds_header_row_after_title_block()
    {
        $mapper = new BoqColumnMapper();

        // Simulate a file where rows 0-2 are project metadata, row 3 is the real header
        $rows = [
            ['Project', ': Enterprise Bank Renovation', '', '', '', ''],
            ['Location', ': Mati Branch', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Item', 'Details', 'Qty.', 'Unit', 'Price', 'Amount'],
            ['Concreting Works', 'Concreting', '1.00', 'ls', '35000', '35000'],
        ];

        // Find which row has the most matches
        $bestIndex = 0;
        $bestScore = 0;
        foreach ($rows as $i => $row) {
            $mappings = $mapper->map(array_map('strval', $row));
            $score = count(array_filter($mappings, fn($m) => $m['mappedTo'] !== null));
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestIndex = $i;
            }
        }

        $this->assertEquals(3, $bestIndex, 'Header row should be detected at index 3, not 0');
        $this->assertGreaterThan(2, $bestScore, 'Header row should match at least 3 columns');
    }

    public function test_confirm_rejects_invalid_token()
    {
        \Illuminate\Support\Facades\Storage::fake('local');
        [$user, $project] = $this->makeAdminWithProject();

        $response = $this->actingAs($user)
            ->post("/projects/{$project->id}/boq/smart-import/confirm", [
                'token'    => 'nonexistent-token',
                'mappings' => [],
            ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors();
    }
}
