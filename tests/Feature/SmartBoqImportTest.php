<?php

namespace Tests\Feature;

use App\Services\BoqColumnMapper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Tests\TestCase;

class SmartBoqImportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(ValidateCsrfToken::class);
    }

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
}
