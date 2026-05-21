# Smart BOQ Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to upload any client Excel BOQ file (not just the system template), have Laravel intelligently map its columns to system fields via a synonym dictionary, show a mapping preview for correction, then save using the existing bulk import logic.

**Architecture:** A new `BoqColumnMapper` service maps arbitrary Excel headers to system fields using a synonym dictionary. A `SmartBoqImportController` handles two JSON endpoints: `analyze` (reads file, returns mappings + sample rows + temp token) and `confirm` (loads temp file, applies confirmed mappings, delegates to existing `BoqService::bulkStore`). A new `SmartImportPreviewModal` React component handles the two-step UI flow.

**Tech Stack:** PHP 8.x / Laravel, PhpSpreadsheet via `maatwebsite/excel` or native `PhpOffice\PhpSpreadsheet`, React 18, Inertia.js, existing `xlsx` npm package (already installed), Tailwind CSS, `sonner` toasts, Axios (already available via Laravel).

---

## File Map

**Create:**
- `app/Services/BoqColumnMapper.php` — synonym dictionary + header-to-field mapping logic
- `app/Http/Controllers/SmartBoqImportController.php` — analyze + confirm endpoints
- `resources/js/Components/Boq/SmartImportPreviewModal.jsx` — two-step import UI
- `tests/Feature/SmartBoqImportTest.php` — feature tests for both endpoints

**Modify:**
- `routes/web.php` — add 2 new routes under `can:manage boq` middleware group
- `resources/js/Pages/Projects/Boq.jsx` — add Smart Import button + wire up modal
- `resources/js/Utils/boqFileUtils.js` — add `applyMappingsToRows()` helper

---

## Task 1: BoqColumnMapper Service

**Files:**
- Create: `app/Services/BoqColumnMapper.php`
- Test: `tests/Feature/SmartBoqImportTest.php` (mapper unit tests inside feature test class)

- [ ] **Step 1: Create the test file with mapper tests**

```php
<?php
// tests/Feature/SmartBoqImportTest.php

namespace Tests\Feature;

use App\Services\BoqColumnMapper;
use Tests\TestCase;

class SmartBoqImportTest extends TestCase
{
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
php artisan test tests/Feature/SmartBoqImportTest.php
```
Expected: FAIL — `App\Services\BoqColumnMapper` not found.

- [ ] **Step 3: Create the BoqColumnMapper service**

```php
<?php
// app/Services/BoqColumnMapper.php

namespace App\Services;

class BoqColumnMapper
{
    private array $synonyms = [
        'itemDescription' => [
            'item description', 'description', 'item', 'particulars',
            'work item', 'scope of work', 'scope of works', 'name',
            'item name', 'works', 'details', 'description of work',
            'description of works', 'item no', 'work description',
        ],
        'unit' => [
            'unit', 'uom', 'unit of measure', 'units', 'u/m', 'unit of measurement',
        ],
        'quantity' => [
            'quantity', 'qty', 'qty.', 'volume', 'no.', 'nos',
            'count', 'no. of units', 'nos.', 'no',
        ],
        'materialUnitCost' => [
            'material unit cost', 'mat. cost', 'material cost',
            'mat cost', 'material rate', 'mat. unit cost', 'material unit rate',
            'materials', 'mat.',
        ],
        'laborUnitCost' => [
            'labor unit cost', 'labour cost', 'labor cost',
            'lab. cost', 'labor rate', 'labour rate', 'manpower cost',
            'labor unit rate', 'labour unit cost',
        ],
        'totalCost' => [
            'total', 'total cost', 'amount', 'total amount',
            'total price', 'extended cost', 'total unit cost', 'grand total',
        ],
    ];

    /**
     * Map an array of Excel headers to system field names.
     *
     * @param  array<string>  $headers
     * @return array<array{columnIndex: int, originalHeader: string, mappedTo: string|null, confidence: string|null}>
     */
    public function map(array $headers): array
    {
        return array_map(function (string $header, int $index) {
            $normalized = strtolower(trim($header));
            $match = $this->findMatch($normalized);

            return [
                'columnIndex'    => $index,
                'originalHeader' => $header,
                'mappedTo'       => $match['field'],
                'confidence'     => $match['confidence'],
            ];
        }, $headers, array_keys($headers));
    }

    private function findMatch(string $normalized): array
    {
        foreach ($this->synonyms as $field => $synonymList) {
            if (in_array($normalized, $synonymList, true)) {
                return ['field' => $field, 'confidence' => 'high'];
            }
        }

        foreach ($this->synonyms as $field => $synonymList) {
            foreach ($synonymList as $synonym) {
                if (str_contains($normalized, $synonym) || str_contains($synonym, $normalized)) {
                    return ['field' => $field, 'confidence' => 'low'];
                }
            }
        }

        return ['field' => null, 'confidence' => null];
    }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
php artisan test tests/Feature/SmartBoqImportTest.php
```
Expected: All mapper tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/Services/BoqColumnMapper.php tests/Feature/SmartBoqImportTest.php
git commit -m "feat: add BoqColumnMapper service with synonym dictionary"
```

---

## Task 2: SmartBoqImportController + Routes

**Files:**
- Create: `app/Http/Controllers/SmartBoqImportController.php`
- Modify: `routes/web.php`
- Test: `tests/Feature/SmartBoqImportTest.php` (add controller tests)

- [ ] **Step 1: Add controller feature tests to the existing test file**

Append these test methods inside `SmartBoqImportTest` class (after the existing mapper tests):

```php
use App\Models\Client;
use App\Models\Project;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
```

Add `use RefreshDatabase;` trait to the class and add `setUp`:

```php
use RefreshDatabase;

protected function setUp(): void
{
    parent::setUp();
    $this->withoutMiddleware(ValidateCsrfToken::class);
    Storage::fake('local');
}

private function makeAdminWithProject(): array
{
    $this->seed(RolesAndPermissionsSeeder::class);
    $user = User::factory()->create(['role' => 'admin']);
    $user->assignRole('admin');
    $client = Client::factory()->create();
    $project = Project::factory()->create([
        'client_id' => $client->id,
        'status' => 'PLANNING',
        'approved_by' => null,
    ]);
    return [$user, $project];
}

public function test_analyze_rejects_non_excel_file()
{
    [$user, $project] = $this->makeAdminWithProject();

    $file = UploadedFile::fake()->create('test.pdf', 100, 'application/pdf');

    $response = $this->actingAs($user)
        ->postJson("/projects/{$project->id}/boq/smart-import/analyze", [
            'file' => $file,
        ]);

    $response->assertStatus(422);
}

public function test_analyze_returns_mappings_and_token_for_valid_excel()
{
    [$user, $project] = $this->makeAdminWithProject();

    // Create a minimal xlsx file using PhpSpreadsheet
    $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();
    $sheet->setCellValue('A1', 'ITEM DESCRIPTION');
    $sheet->setCellValue('B1', 'UNIT');
    $sheet->setCellValue('C1', 'QTY');
    $sheet->setCellValue('D1', 'UNIT COST');
    $sheet->setCellValue('A2', 'Concreting Works');
    $sheet->setCellValue('B2', 'lot');
    $sheet->setCellValue('C2', '1');
    $sheet->setCellValue('D2', '12500');

    $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
    $tmpPath = sys_get_temp_dir() . '/test_boq.xlsx';
    $writer->save($tmpPath);
    $file = new UploadedFile($tmpPath, 'test_boq.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);

    $response = $this->actingAs($user)
        ->postJson("/projects/{$project->id}/boq/smart-import/analyze", [
            'file' => $file,
        ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'token',
            'headers',
            'sampleRows',
            'mappings' => [
                '*' => ['columnIndex', 'originalHeader', 'mappedTo', 'confidence']
            ],
            'totalRows',
        ]);

    $this->assertEquals('itemDescription', $response->json('mappings.0.mappedTo'));
    $this->assertNotNull($response->json('token'));
}

public function test_confirm_saves_boq_items_using_confirmed_mappings()
{
    [$user, $project] = $this->makeAdminWithProject();

    // Store a fake rows payload in temp storage
    $token = \Illuminate\Support\Str::uuid()->toString();
    $rows = [
        ['Concreting Works', 'lot', '1', '12500', '3000'],
        ['Masonry Works', 'sqm', '45', '8200', '1500'],
    ];
    Storage::put("boq_imports/{$token}.json", json_encode($rows));

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
    $this->assertDatabaseHas('boq_items', ['item_description' => 'Concreting Works', 'project_id' => $project->id]);
    $this->assertDatabaseHas('boq_items', ['item_description' => 'Masonry Works']);
    Storage::assertMissing("boq_imports/{$token}.json");
}

public function test_confirm_rejects_invalid_token()
{
    [$user, $project] = $this->makeAdminWithProject();

    $response = $this->actingAs($user)
        ->post("/projects/{$project->id}/boq/smart-import/confirm", [
            'token'    => 'nonexistent-token',
            'mappings' => [],
        ]);

    $response->assertStatus(422);
}
```

- [ ] **Step 2: Run new tests to confirm they fail**

```bash
php artisan test tests/Feature/SmartBoqImportTest.php --filter="test_analyze|test_confirm"
```
Expected: FAIL — routes/controller not found.

- [ ] **Step 3: Add routes to `routes/web.php`**

Inside the `can:manage boq` middleware group (after the existing `boq/bulk` route), add:

```php
Route::post('/projects/{project}/boq/smart-import/analyze', [SmartBoqImportController::class, 'analyze'])->name('projects.boq.smart-import.analyze');
Route::post('/projects/{project}/boq/smart-import/confirm', [SmartBoqImportController::class, 'confirm'])->name('projects.boq.smart-import.confirm');
```

Also add the import at the top of `routes/web.php`:
```php
use App\Http\Controllers\SmartBoqImportController;
```

- [ ] **Step 4: Create the controller**

```php
<?php
// app/Http/Controllers/SmartBoqImportController.php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\BoqColumnMapper;
use App\Services\BoqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class SmartBoqImportController extends Controller
{
    public function __construct(
        private BoqColumnMapper $mapper,
        private BoqService $boqService,
    ) {}

    public function analyze(Request $request, Project $project): JsonResponse
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:20480',
        ]);

        $spreadsheet = IOFactory::load($request->file('file')->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $allRows = $sheet->toArray(null, true, true, false);

        // First non-empty row is the header row
        $allRows = array_values(array_filter($allRows, fn($r) => array_filter($r, fn($c) => $c !== null && $c !== '')));

        if (empty($allRows)) {
            return response()->json(['message' => 'The file appears to be empty.'], 422);
        }

        $headers = array_map(fn($v) => (string) ($v ?? ''), $allRows[0]);
        $dataRows = array_slice($allRows, 1);

        // Store all data rows as JSON for the confirm step
        $token = Str::uuid()->toString();
        Storage::put(
            "boq_imports/{$token}.json",
            json_encode(array_map(fn($r) => array_values(array_map(fn($v) => (string) ($v ?? ''), $r)), $dataRows))
        );

        return response()->json([
            'token'      => $token,
            'headers'    => $headers,
            'sampleRows' => array_slice($dataRows, 0, 5),
            'mappings'   => $this->mapper->map($headers),
            'totalRows'  => count($dataRows),
        ]);
    }

    public function confirm(Request $request, Project $project): RedirectResponse
    {
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $request->validate([
            'token'    => 'required|string',
            'mappings' => 'required|array',
        ]);

        $path = "boq_imports/{$request->token}.json";

        if (! Storage::exists($path)) {
            return back()->withErrors(['token' => 'Import session expired. Please re-upload the file.']);
        }

        $rows = json_decode(Storage::get($path), true);
        Storage::delete($path);

        $fieldByIndex = collect($request->mappings)
            ->filter(fn($m) => ! empty($m['mappedTo']))
            ->pluck('mappedTo', 'columnIndex')
            ->all();

        $items = collect($rows)
            ->map(fn($row) => $this->rowToItem($row, $fieldByIndex))
            ->filter(fn($item) => ! empty($item['itemDescription']))
            ->values()
            ->all();

        if (empty($items)) {
            return back()->withErrors(['file' => 'No valid BOQ items could be parsed from the file.']);
        }

        $this->boqService->bulkStore($items, $project);

        return redirect()->back()->with('success', count($items) . ' BOQ items imported successfully.');
    }

    private function rowToItem(array $row, array $fieldByIndex): array
    {
        $item = [
            'itemDescription'  => '',
            'unit'             => 'lot',
            'quantity'         => 1,
            'materialUnitPrice' => 0,
            'laborUnitPrice'   => 0,
            'isCarport'        => false,
            'components'       => [],
        ];

        foreach ($fieldByIndex as $colIndex => $field) {
            $value = $row[$colIndex] ?? '';
            match ($field) {
                'itemDescription'  => $item['itemDescription']  = (string) $value,
                'unit'             => $item['unit']             = (string) $value ?: 'lot',
                'quantity'         => $item['quantity']         = (float) $value ?: 1,
                'materialUnitCost' => $item['materialUnitPrice'] = (float) $value,
                'laborUnitCost'    => $item['laborUnitPrice']   = (float) $value,
                default            => null,
            };
        }

        return $item;
    }
}
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
php artisan test tests/Feature/SmartBoqImportTest.php
```
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add app/Http/Controllers/SmartBoqImportController.php routes/web.php tests/Feature/SmartBoqImportTest.php
git commit -m "feat: add SmartBoqImportController with analyze and confirm endpoints"
```

---

## Task 3: `applyMappingsToRows` helper in boqFileUtils.js

**Files:**
- Modify: `resources/js/Utils/boqFileUtils.js`

This helper is used in the frontend to re-render the live preview table as the user adjusts column mappings.

- [ ] **Step 1: Add the helper at the end of `boqFileUtils.js`**

```js
/**
 * Applies confirmed column mappings to raw row data for preview display.
 * @param {Array<Array<string>>} rows - Raw rows from the analyze response.
 * @param {Array<{columnIndex: number, mappedTo: string|null}>} mappings
 * @returns {Array<{itemDescription, unit, quantity, materialUnitPrice, laborUnitPrice}>}
 */
export const applyMappingsToRows = (rows, mappings) => {
    const fieldByIndex = {};
    mappings.forEach(m => {
        if (m.mappedTo) fieldByIndex[m.columnIndex] = m.mappedTo;
    });

    return rows
        .map(row => {
            const item = {
                itemDescription: '',
                unit: 'lot',
                quantity: 1,
                materialUnitPrice: 0,
                laborUnitPrice: 0,
            };
            Object.entries(fieldByIndex).forEach(([colIndex, field]) => {
                const value = row[colIndex] ?? '';
                switch (field) {
                    case 'itemDescription':  item.itemDescription  = String(value); break;
                    case 'unit':             item.unit             = String(value) || 'lot'; break;
                    case 'quantity':         item.quantity         = parseFloat(value) || 1; break;
                    case 'materialUnitCost': item.materialUnitPrice = parseFloat(value) || 0; break;
                    case 'laborUnitCost':    item.laborUnitPrice   = parseFloat(value) || 0; break;
                }
            });
            return item;
        })
        .filter(item => item.itemDescription.trim() !== '');
};
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/Utils/boqFileUtils.js
git commit -m "feat: add applyMappingsToRows helper for smart import preview"
```

---

## Task 4: SmartImportPreviewModal React Component

**Files:**
- Create: `resources/js/Components/Boq/SmartImportPreviewModal.jsx`

- [ ] **Step 1: Create the component**

```jsx
// resources/js/Components/Boq/SmartImportPreviewModal.jsx

import React, { useState, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { X, AlertTriangle, CheckCircle, Upload } from 'lucide-react';
import { applyMappingsToRows } from '@/Utils/boqFileUtils';

const FIELD_OPTIONS = [
    { value: '',                label: '-- Skip --' },
    { value: 'itemDescription', label: 'Description' },
    { value: 'unit',            label: 'Unit' },
    { value: 'quantity',        label: 'Quantity' },
    { value: 'materialUnitCost',label: 'Material Unit Cost' },
    { value: 'laborUnitCost',   label: 'Labor Unit Cost' },
    { value: 'totalCost',       label: 'Total Cost (ref. only)' },
];

export default function SmartImportPreviewModal({ isOpen, onClose, projectId, analyzeData }) {
    const [mappings, setMappings] = useState(analyzeData?.mappings ?? []);
    const [submitting, setSubmitting] = useState(false);

    const { token, sampleRows = [], totalRows = 0 } = analyzeData ?? {};

    const previewItems = useMemo(
        () => applyMappingsToRows(sampleRows, mappings),
        [sampleRows, mappings]
    );

    const canConfirm = mappings.some(m => m.mappedTo === 'itemDescription') &&
                       mappings.some(m => m.mappedTo === 'quantity');

    const handleMappingChange = (columnIndex, newField) => {
        setMappings(prev =>
            prev.map(m =>
                m.columnIndex === columnIndex ? { ...m, mappedTo: newField || null } : m
            )
        );
    };

    const handleConfirm = () => {
        setSubmitting(true);
        router.post(
            `/projects/${projectId}/boq/smart-import/confirm`,
            { token, mappings },
            {
                onSuccess: () => { setSubmitting(false); onClose(); },
                onError:   () => { setSubmitting(false); },
            }
        );
    };

    if (!isOpen || !analyzeData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Smart BOQ Import — Map Columns</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{totalRows} rows detected. Review the column mapping before importing.</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">

                    {/* Column Mapping Table */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Column Mapping</h3>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr className="text-xs text-slate-500 uppercase tracking-wider">
                                        <th className="px-4 py-2.5 text-left font-semibold">Client Column</th>
                                        <th className="px-4 py-2.5 text-left font-semibold">Maps To</th>
                                        <th className="px-4 py-2.5 text-left font-semibold">Confidence</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {mappings.map(m => (
                                        <tr key={m.columnIndex} className={m.confidence === 'low' ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
                                            <td className="px-4 py-2.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                                                {m.originalHeader}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <select
                                                    value={m.mappedTo ?? ''}
                                                    onChange={e => handleMappingChange(m.columnIndex, e.target.value)}
                                                    className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:border-purple-500 focus:ring-0 outline-none w-full"
                                                >
                                                    {FIELD_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {m.confidence === 'high' && (
                                                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                                        <CheckCircle size={12} /> High
                                                    </span>
                                                )}
                                                {m.confidence === 'low' && (
                                                    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                                                        <AlertTriangle size={12} /> Low
                                                    </span>
                                                )}
                                                {!m.confidence && (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sample Data Preview */}
                    {previewItems.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Sample Preview (first {previewItems.length} rows)
                            </h3>
                            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-800">
                                        <tr className="text-slate-500 uppercase tracking-wider">
                                            <th className="px-3 py-2 text-left font-semibold">Description</th>
                                            <th className="px-3 py-2 text-left font-semibold">Unit</th>
                                            <th className="px-3 py-2 text-right font-semibold">Qty</th>
                                            <th className="px-3 py-2 text-right font-semibold">Mat. Cost</th>
                                            <th className="px-3 py-2 text-right font-semibold">Lab. Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {previewItems.map((item, i) => (
                                            <tr key={i} className="text-slate-700 dark:text-slate-300">
                                                <td className="px-3 py-2 max-w-[250px] truncate">{item.itemDescription}</td>
                                                <td className="px-3 py-2">{item.unit}</td>
                                                <td className="px-3 py-2 text-right">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right">{item.materialUnitPrice.toLocaleString()}</td>
                                                <td className="px-3 py-2 text-right">{item.laborUnitPrice.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {!canConfirm && (
                        <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                            <AlertTriangle size={12} className="inline mr-1" />
                            Please map at least <strong>Description</strong> and <strong>Quantity</strong> columns to enable import.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canConfirm || submitting}
                        className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                    >
                        <Upload size={14} />
                        {submitting ? 'Importing...' : `Confirm & Import ${totalRows} rows`}
                    </button>
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add resources/js/Components/Boq/SmartImportPreviewModal.jsx
git commit -m "feat: add SmartImportPreviewModal component"
```

---

## Task 5: Wire Up Smart Import Button in Boq.jsx

**Files:**
- Modify: `resources/js/Pages/Projects/Boq.jsx`

- [ ] **Step 1: Add imports at the top of `Boq.jsx`**

Add to the existing imports block:
```js
import SmartImportPreviewModal from '@/Components/Boq/SmartImportPreviewModal';
import { applyMappingsToRows } from '@/Utils/boqFileUtils';
import axios from 'axios';
import { Sparkles } from 'lucide-react';
```

Also add `Sparkles` to the existing lucide import line.

- [ ] **Step 2: Add state for the smart import modal**

Add after the existing state declarations (around line 32):
```js
const [smartImport, setSmartImport] = useState({ open: false, data: null, analyzing: false });
```

- [ ] **Step 3: Add the handleSmartImport function**

Add after the `handleBulkUpload` function (around line 194):
```js
const handleSmartImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setSmartImport(s => ({ ...s, analyzing: true }));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('_token', document.querySelector('meta[name="csrf-token"]').getAttribute('content'));

    try {
        const { data } = await axios.post(
            `/projects/${project.id}/boq/smart-import/analyze`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        setSmartImport({ open: true, data, analyzing: false });
    } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to analyze file.');
        setSmartImport({ open: false, data: null, analyzing: false });
    }
};
```

- [ ] **Step 4: Add the Smart Import button to the toolbar**

In the toolbar section (around line 309, inside the `!isApproved` block), add the Smart Import button **before** the existing template upload label:

```jsx
{/* Smart Import button */}
<label
    className="p-2 text-slate-500 hover:text-purple-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow cursor-pointer relative"
    title={smartImport.analyzing ? 'Analyzing...' : 'Smart Import (any Excel format)'}
>
    {smartImport.analyzing
        ? <RefreshCcw size={16} className="animate-spin" />
        : <Sparkles size={16} />
    }
    <input
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleSmartImport}
        disabled={loading || smartImport.analyzing}
    />
</label>
```

- [ ] **Step 5: Mount the modal at the bottom of the JSX return**

Add before the closing `</AuthenticatedLayout>` tag:
```jsx
<SmartImportPreviewModal
    isOpen={smartImport.open}
    onClose={() => setSmartImport({ open: false, data: null, analyzing: false })}
    projectId={project.id}
    analyzeData={smartImport.data}
/>
```

- [ ] **Step 6: Commit**

```bash
git add resources/js/Pages/Projects/Boq.jsx
git commit -m "feat: wire up Smart Import button and modal in BOQ page"
```

---

## Task 6: Verify PhpSpreadsheet Dependency

**Files:**
- `composer.json` (check only, do not modify if already present)

- [ ] **Step 1: Check if PhpSpreadsheet is already installed**

```bash
php -r "echo class_exists('PhpOffice\PhpSpreadsheet\IOFactory') ? 'OK' : 'MISSING';"
```

If output is `OK`, skip to Step 3.

- [ ] **Step 2: Install if missing**

```bash
composer require phpoffice/phpspreadsheet
```

- [ ] **Step 3: Run all tests to confirm nothing is broken**

```bash
php artisan test
```
Expected: All tests PASS.

- [ ] **Step 4: Final commit if composer.json changed**

```bash
git add composer.json composer.lock
git commit -m "chore: ensure phpoffice/phpspreadsheet is installed for smart BOQ import"
```

---

## Done

All tasks complete when:
- `php artisan test` passes fully
- Smart Import button appears in BOQ toolbar (✦ sparkle icon)
- Uploading a client Excel shows the column mapping modal
- Low-confidence mappings are highlighted in amber
- Confirm is blocked until Description + Quantity are mapped
- Submitting saves BOQ items and closes the modal
