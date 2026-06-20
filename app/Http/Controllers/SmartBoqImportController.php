<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\BoqColumnMapper;
use App\Services\BoqItemClassifier;
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
        private BoqItemClassifier $classifier,
    ) {}

    public function analyze(Request $request, Project $project): JsonResponse
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:20480',
        ]);

        $spreadsheet = IOFactory::load($request->file('file')->getRealPath());
        $sheet = $spreadsheet->getActiveSheet();
        $allRows = $sheet->toArray(null, true, false, false);

        $allRows = array_values(array_filter($allRows, fn($r) => count(array_filter($r, fn($c) => $c !== null && $c !== '')) > 0));

        if (empty($allRows)) {
            return response()->json(['message' => 'The file appears to be empty.'], 422);
        }

        $headerRowIndex = $this->findHeaderRowIndex($allRows);
        $headers = array_map(fn($v) => (string) ($v ?? ''), $allRows[$headerRowIndex]);
        $dataRows = array_slice($allRows, $headerRowIndex + 1);

        $castRows = array_map(
            fn($r) => array_values(array_map(fn($v) => (string) ($v ?? ''), $r)),
            $dataRows
        );

        $token = Str::uuid()->toString();
        Storage::put("boq_imports/{$token}.json", json_encode($castRows));

        return response()->json([
            'token'      => $token,
            'headers'    => $headers,
            'sampleRows' => array_slice($castRows, 0, 5),
            'mappings'   => $this->mapper->map($headers),
            'totalRows'  => count($castRows),
        ]);
    }

    public function confirm(Request $request, Project $project): RedirectResponse
    {
        $request->validate([
            'token'       => 'required|string|uuid',
            'mappings'    => 'required|array',
            'overrides'   => 'nullable|array',
            'overrides.*' => 'nullable|in:DIRECT_MATERIAL,SERVICE,BUNDLE',
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

        $overrides = $request->overrides ?? [];

        $items = collect($rows)
            ->values()
            ->map(function ($row, $index) use ($fieldByIndex, $overrides) {
                $item = $this->rowToItem($row, $fieldByIndex);
                $item['nature'] = $overrides[$index]
                    ?? $this->classifier->classify($item['itemDescription']);
                return $item;
            })
            ->filter(fn($item) => ! empty($item['itemDescription']))
            ->filter(fn($item) => ! $this->isSummaryRow($item['itemDescription']))
            ->unique('itemDescription')
            ->values()
            ->all();

        if (empty($items)) {
            return back()->withErrors(['file' => 'No valid BOQ items could be parsed from the file.']);
        }

        $this->boqService->bulkStore($items, $project);

        return redirect()->back()->with('success', count($items) . ' BOQ items imported successfully.');
    }

    private function findHeaderRowIndex(array $allRows): int
    {
        $bestIndex = 0;
        $bestScore = 0;

        foreach (array_slice($allRows, 0, 30, true) as $i => $row) {
            $headers = array_map(fn($v) => (string) ($v ?? ''), $row);
            $score = count(array_filter(
                $this->mapper->map($headers),
                fn($m) => $m['mappedTo'] !== null
            ));

            if ($score > $bestScore) {
                $bestScore = $score;
                $bestIndex = $i;
            }
        }

        return $bestIndex;
    }

    private function isSummaryRow(string $description): bool
    {
        return (bool) preg_match(
            '/^(total|sub.?total|grand total|amount without|amount per|carport area|floor area|output per|direct unit cost)/i',
            trim($description)
        );
    }

    private function rowToItem(array $row, array $fieldByIndex): array
    {
        $item = [
            'itemDescription'   => '',
            'unit'              => 'lot',
            'quantity'          => 1,
            'materialUnitPrice' => 0,
            'laborUnitPrice'    => 0,
            'isCarport'         => false,
            'components'        => [],
        ];

        foreach ($fieldByIndex as $colIndex => $field) {
            $value = $row[$colIndex] ?? '';
            match ($field) {
                'itemDescription'  => $item['itemDescription']   = (string) $value,
                'unit'             => $item['unit']              = (string) $value ?: 'lot',
                'quantity'         => $item['quantity']          = ($value !== '' && $value !== null) ? (float) str_replace(',', '', $value) : 1,
                'materialUnitCost' => $item['materialUnitPrice'] = (float) str_replace(',', '', $value),
                'laborUnitCost'    => $item['laborUnitPrice']    = (float) str_replace(',', '', $value),
                default            => null,
            };
        }

        return $item;
    }
}
