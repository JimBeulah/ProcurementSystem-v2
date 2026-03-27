<?php

namespace App\Services;

use App\Models\BoqItem;
use App\Models\BoqItemComponent;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class BoqService
{
    public function store(array $validated, Project $project): BoqItem
    {
        return DB::transaction(function () use ($validated, $project) {
            $boqItem = BoqItem::create([
                'project_id' => $project->id,
                'item_description' => $validated['item_description'],
                'unit' => $validated['unit'],
                'quantity' => $validated['quantity'],
                'material_unit_price' => $validated['material_unit_price'] ?? 0,
                'labor_unit_price' => $validated['labor_unit_price'] ?? 0,
                'is_carport' => $validated['is_carport'] ?? false,
            ]);

            if (! empty($validated['components'])) {
                $componentsData = collect($validated['components'])->map(function ($comp) {
                    return [
                        'resource_type' => $comp['resourceType'],
                        'name' => $comp['name'],
                        'unit' => $comp['unit'] ?? null,
                        'quantity_factor' => $comp['quantityFactor'],
                        'client_unit_rate' => $comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0,
                        'client_total_cost' => ($comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0) * $comp['quantityFactor'],
                        'altapil_unit_rate' => $comp['altapilUnitRate'] ?? 0,
                        'altapil_total_cost' => ($comp['altapilUnitRate'] ?? 0) * $comp['quantityFactor'],
                        'no_of_persons' => $comp['noOfPersons'] ?? 0,
                        'hours' => $comp['hours'] ?? 0,
                    ];
                })->toArray();

                $boqItem->components()->createMany($componentsData);
                $boqItem->recalculateTotals();
            }

            return $boqItem;
        });
    }

    public function bulkStore(array $itemsData, Project $project): void
    {
        DB::transaction(function () use ($itemsData, $project) {
            foreach ($itemsData as $itemData) {
                $boqItem = BoqItem::create([
                    'project_id' => $project->id,
                    'item_description' => $itemData['itemDescription'],
                    'unit' => $itemData['unit'],
                    'quantity' => $itemData['quantity'],
                    'material_unit_price' => $itemData['materialUnitPrice'],
                    'labor_unit_price' => $itemData['laborUnitPrice'],
                    'is_carport' => $itemData['isCarport'] ?? false,
                ]);

                if (! empty($itemData['components'])) {
                    $componentsData = collect($itemData['components'])->map(function ($comp) {
                        return [
                            'resource_type' => $comp['resourceType'],
                            'name' => $comp['name'],
                            'unit' => $comp['unit'] ?? null,
                            'quantity_factor' => $comp['quantityFactor'],
                            'client_unit_rate' => $comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0,
                            'client_total_cost' => ($comp['clientUnitRate'] ?? $comp['unitRate'] ?? 0) * $comp['quantityFactor'],
                            'altapil_unit_rate' => $comp['altapilUnitRate'] ?? 0,
                            'altapil_total_cost' => ($comp['altapilUnitRate'] ?? 0) * $comp['quantityFactor'],
                            'no_of_persons' => $comp['noOfPersons'] ?? 0,
                            'hours' => $comp['hours'] ?? 0,
                        ];
                    })->toArray();

                    $boqItem->components()->createMany($componentsData);
                    $boqItem->recalculateTotals();
                }
            }
        });
    }

    public function storeComponent(array $validated, BoqItem $boqItem): BoqItemComponent
    {
        return DB::transaction(function () use ($validated, $boqItem) {
            return $boqItem->components()->create([
                'resource_type' => $validated['resourceType'],
                'name' => $validated['name'],
                'unit' => $validated['unit'] ?? null,
                'quantity_factor' => $validated['quantityFactor'],
                'client_unit_rate' => $validated['clientUnitRate'],
                'client_total_cost' => $validated['clientUnitRate'] * $validated['quantityFactor'],
                'altapil_unit_rate' => $validated['altapilUnitRate'] ?? 0,
                'altapil_total_cost' => ($validated['altapilUnitRate'] ?? 0) * $validated['quantityFactor'],
                'no_of_persons' => $validated['noOfPersons'] ?? 0,
                'hours' => $validated['hours'] ?? 0,
            ]);
        });
    }

    public function updateComponent(array $validated, BoqItemComponent $boqComponent): BoqItemComponent
    {
        return DB::transaction(function () use ($validated, $boqComponent) {
            $boqComponent->update([
                'resource_type' => $validated['resourceType'],
                'name' => $validated['name'],
                'unit' => $validated['unit'] ?? null,
                'quantity_factor' => $validated['quantityFactor'],
                'client_unit_rate' => $validated['clientUnitRate'],
                'client_total_cost' => $validated['clientUnitRate'] * $validated['quantityFactor'],
                'altapil_unit_rate' => $validated['altapilUnitRate'] ?? 0,
                'altapil_total_cost' => ($validated['altapilUnitRate'] ?? 0) * $validated['quantityFactor'],
                'no_of_persons' => $validated['noOfPersons'] ?? 0,
                'hours' => $validated['hours'] ?? 0,
            ]);

            return $boqComponent;
        });
    }
}
