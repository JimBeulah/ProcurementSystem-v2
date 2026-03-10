<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\Project;
use App\Models\SiteRelease;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OperationsController extends Controller
{
    public function deliveries(Request $request): Response
    {
        $user = $request->user();

        // --- Warehouse Releases (site_release records that are in transit / pending) ---
        $warehouseQuery = SiteRelease::with(['inventoryItem.project', 'releasedBy']);

        if ($user->hasRole('site_engineer')) {
            $projectIds = Project::where('site_engineer_id', $user->id)->pluck('id');
            $warehouseQuery->whereIn('project_id', $projectIds);
        }

        $warehouseDeliveries = $warehouseQuery
            ->whereIn('status', ['IN_TRANSIT', 'PENDING'])
            ->latest()
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'type' => 'site_release',
                'title' => 'Warehouse Dispatch #' . str_pad($r->id, 4, '0', STR_PAD_LEFT),
                'material_name' => $r->inventoryItem?->material_name ?? '—',
                'project_name' => $r->inventoryItem?->project?->name ?? 'N/A',
                'issued_to' => $r->issued_to,
                'quantity' => $r->quantity_released,
                'unit' => $r->unit ?? '',
                'released_by' => $r->releasedBy?->name,
                'release_date' => $r->release_date,
                'status' => $r->status,
                'created_at' => $r->created_at->diffForHumans(),
            ]);

        // --- Supplier Deliveries (purchase orders awaiting receipt at site) ---
        $poQuery = PurchaseOrder::with(['project', 'supplier', 'items'])
            ->whereIn('status', ['APPROVED', 'PARTIALLY DELIVERED']);

        if ($user->hasRole('site_engineer')) {
            $projectIds = $projectIds ?? Project::where('site_engineer_id', $user->id)->pluck('id');
            $poQuery->whereIn('project_id', $projectIds);
        }

        $supplierDeliveries = $poQuery
            ->latest()
            ->get()
            ->map(fn($po) => [
                'id' => $po->id,
                'type' => 'purchase_order',
                'title' => 'PO-' . str_pad($po->id, 4, '0', STR_PAD_LEFT),
                'supplier' => $po->supplier?->name ?? '—',
                'project_name' => $po->project?->name ?? 'N/A',
                'status' => $po->status,
                'created_at' => $po->updated_at->diffForHumans(),
                'items' => $po->items->map(fn($item) => [
                    'id' => $item->id,
                    'material_name' => $item->material_name,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                ])->values()->all(),
            ]);

        // --- Merged for the "All" tab ---
        $allDeliveries = $supplierDeliveries->concat($warehouseDeliveries)->values();

        return Inertia::render('Operations/Deliveries', [
            'allDeliveries' => $allDeliveries,
            'supplierDeliveries' => $supplierDeliveries,
            'warehouseDeliveries' => $warehouseDeliveries,
        ]);
    }
}
