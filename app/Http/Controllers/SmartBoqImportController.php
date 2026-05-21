<?php

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

        $allRows = array_values(array_filter($allRows, fn($r) => count(array_filter($r, fn($c) => $c !== null && $c !== '')) > 0));

        if (empty($allRows)) {
            return response()->json(['message' => 'The file appears to be empty.'], 422);
        }

        $headers = array_map(fn($v) => (string) ($v ?? ''), $allRows[0]);
        $dataRows = array_slice($allRows, 1);

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
        if ($project->approved_by) {
            abort(403, 'Project is approved. Modifications are locked.');
        }

        $request->validate([
            'token'    => 'required|string|uuid',
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
                'quantity'         => $item['quantity']          = ($value !== '' && $value !== null) ? (float) $value : 1,
                'materialUnitCost' => $item['materialUnitPrice'] = (float) $value,
                'laborUnitCost'    => $item['laborUnitPrice']    = (float) $value,
                default            => null,
            };
        }

        return $item;
    }
}
