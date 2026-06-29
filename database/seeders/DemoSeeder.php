<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Disbursement;
use App\Models\InventoryItem;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Project;
use App\Models\BoqItem;
use App\Models\BoqItemComponent;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\ReceivingItem;
use App\Models\ReceivingReport;
use App\Models\SiteRelease;
use App\Models\Supplier;
use App\Models\SupplierInvoice;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo seeder — run on a fresh database only.
 *
 * php artisan migrate:fresh && php artisan db:seed --class=DemoSeeder
 *
 * Produces 6 mixed building/infrastructure projects in various lifecycle stages:
 *   1. SM Lipa Commercial Complex          — full lifecycle (BOQ → payment done)
 *   2. DPWH Batangas Circumferential Road  — partial delivery in progress
 *   3. Lipa City Flood Control & Drainage  — completed project
 *   4. Cavite Residential Subdivision      — planning stage (BOQ only)
 *   5. Tagaytay Highland Resort Hotel      — pending MR awaiting approval
 *   6. Padre Garcia Farm-to-Market Road    — PO pending approval
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolesAndPermissionsSeeder::class,
            ProjectTypesSeeder::class,
        ]);

        // ──────────────────────────────────────────────────────────────────
        // USERS  (password: "password" for all)
        // ──────────────────────────────────────────────────────────────────
        $admin = $this->user('Juan dela Cruz',    'jdelacruz',  'admin@altapil.com',       'admin');
        $pm    = $this->user('Maria Santos',       'msantos',    'pm@altapil.com',           'project_manager');
        $eng1  = $this->user('Roberto Reyes',      'rreyes',     'rreyes@altapil.com',       'site_engineer');
        $eng2  = $this->user('Jose Villanueva',    'jvillanueva','jvillanueva@altapil.com',  'site_engineer');
        $whm   = $this->user('Carlos Mendoza',     'cmendoza',   'cmendoza@altapil.com',     'warehouse');
        $proc  = $this->user('Ana Garcia',         'agarcia',    'agarcia@altapil.com',      'procurement_officer');
        $fin   = $this->user('Elena Torres',       'etorres',    'etorres@altapil.com',      'finance');

        // ──────────────────────────────────────────────────────────────────
        // CLIENTS
        // ──────────────────────────────────────────────────────────────────
        $dpwh        = Client::firstOrCreate(['name' => 'Department of Public Works and Highways (DPWH)']);
        $lguBatangas = Client::firstOrCreate(['name' => 'LGU Batangas City']);
        $smPrime     = Client::firstOrCreate(['name' => 'SM Prime Holdings Inc.']);
        $ayala       = Client::firstOrCreate(['name' => 'Ayala Land Inc.']);

        // ──────────────────────────────────────────────────────────────────
        // SUPPLIERS
        // ──────────────────────────────────────────────────────────────────
        $holcim  = $this->supplier('Holcim Philippines Inc.',     'Bert Flores',    'sales.ph@holcim.com',          '(02) 8888-3000', 'Taguig City, Metro Manila');
        $pacific = $this->supplier('Pacific Steel Corporation',   'Rolando Cruz',   'sales@pacificsteel.com.ph',    '(02) 8527-9100', 'Caloocan City, Metro Manila');
        $wilcon  = $this->supplier('Wilcon Depot Inc.',           'Maricel Tan',    'b2b@wilcon.com.ph',            '(02) 8280-1111', 'Batangas City, Batangas');
        $gmp     = $this->supplier('GMP Matiere Corp.',           'Dante Robles',   'procurement@gmpmatiere.com',   '(043) 723-5000', 'Calamba City, Laguna');
        $eagle   = $this->supplier('Eagle Cement Corporation',    'Sherwin Bautista','orders@eaglecement.com.ph',   '(02) 8534-2888', 'San Ildefonso, Bulacan');

        // ──────────────────────────────────────────────────────────────────
        // WAREHOUSES
        // ──────────────────────────────────────────────────────────────────
        $mainWH = Warehouse::firstOrCreate(
            ['name' => 'Main Warehouse - Batangas City'],
            ['location' => 'Batangas City, Batangas', 'type' => 'CENTRAL']
        );
        Warehouse::firstOrCreate(
            ['name' => 'Site Warehouse - Cavite'],
            ['location' => 'Dasmarinas City, Cavite', 'type' => 'FIELD']
        );

        // ══════════════════════════════════════════════════════════════════
        // PROJECT 1 — SM Lipa Commercial Complex (BUILDING, ONGOING)
        // Full lifecycle: BOQ → MR → PR → PO → Receiving → Inventory → Site Release → Invoice → Disbursement
        // ══════════════════════════════════════════════════════════════════
        $p1 = Project::firstOrCreate(['name' => 'SM Lipa Commercial Complex'], [
            'client_id'        => $smPrime->id,
            'location'         => 'Lipa City, Batangas',
            'budget'           => 85_000_000.00,
            'status'           => 'ONGOING',
            'total_floor_area' => 12500.00,
            'carport_area'     => 1200.00,
            'source_of_fund'   => 'Private Equity',
            'project_type'     => 'BUILDING',
            'contract_type'    => 'Lump Sum',
            'payment_terms'    => '30 days after billing',
            'site_engineer_id' => $eng1->id,
            'target_start_date'=> '2025-03-01',
            'target_end_date'  => '2026-09-30',
            'duration_days'    => 578,
        ]);

        // — BOQ Items —
        $p1b1 = $this->boqItem($p1, 'Excavation and Earthworks', 'cu.m', 500, 'SERVICE');
        $this->component($p1b1, 'LABOR',     'Excavation Labor',      'cu.m', 1.00,  180.00,  180.00,  4, 8.0);
        $this->component($p1b1, 'EQUIPMENT', 'Backhoe Rental',        'hr',   0.25, 2500.00,  625.00);

        $p1b2 = $this->boqItem($p1, 'Reinforced Concrete - Foundation', 'cu.m', 180, 'BUNDLE');
        $this->component($p1b2, 'MATERIAL', 'Portland Cement (40kg)',     'bags', 9.00,  285.00, 2565.00);
        $this->component($p1b2, 'MATERIAL', 'Washed Sand',                'cu.m', 0.50,  950.00,  475.00);
        $this->component($p1b2, 'MATERIAL', '3/4" Crushed Gravel',        'cu.m', 1.00, 1200.00, 1200.00);
        $this->component($p1b2, 'MATERIAL', 'Deformed Bar 16mm x 6m',     'kg',  120.00,  58.00, 6960.00);
        $this->component($p1b2, 'LABOR',    'Concreting Works Labor',      'cu.m', 1.00,  900.00,  900.00, 6, 8.0);

        $p1b3 = $this->boqItem($p1, 'Structural Steel Frame Installation', 'kg', 12500, 'BUNDLE');
        $this->component($p1b3, 'MATERIAL', 'Wide Flange Beam W8x31',     'kg', 0.75, 75.00, 56.25);
        $this->component($p1b3, 'MATERIAL', 'Steel Column Section',        'kg', 0.25, 78.00, 19.50);
        $this->component($p1b3, 'LABOR',    'Steel Fabrication & Erection','kg', 1.00, 35.00, 35.00, 8);

        $p1b4 = $this->boqItem($p1, 'Concrete Hollow Block Masonry', 'sq.m', 1200, 'BUNDLE');
        $this->component($p1b4, 'MATERIAL', '4" Concrete Hollow Block', 'pcs',  12.50, 18.00, 225.00);
        $this->component($p1b4, 'MATERIAL', 'Mortar Cement',            'bags',  0.50, 285.00, 142.50);
        $this->component($p1b4, 'LABOR',    'Masonry Works Labor',      'sq.m',  1.00, 250.00, 250.00, 4);

        // — Material Request 1 — FULFILLED (foundation materials)
        $mr1 = MaterialRequest::create([
            'project_id' => $p1->id, 'requester_id' => $eng1->id, 'approver_id' => $pm->id,
            'request_date' => '2025-04-10 08:00:00', 'status' => 'FULFILLED',
            'remarks' => 'Initial batch for foundation works - Phase 1',
        ]);
        MaterialRequestItem::create(['material_request_id' => $mr1->id, 'item_description' => 'Portland Cement (40kg)',  'quantity' => 1620,  'unit' => 'bags', 'material_unit_price' => 285.00, 'labor_unit_price' => 0, 'boq_item_id' => $p1b2->id]);
        MaterialRequestItem::create(['material_request_id' => $mr1->id, 'item_description' => 'Deformed Bar 16mm x 6m', 'quantity' => 21600, 'unit' => 'kg',   'material_unit_price' =>  58.00, 'labor_unit_price' => 0, 'boq_item_id' => $p1b2->id]);
        MaterialRequestItem::create(['material_request_id' => $mr1->id, 'item_description' => '3/4" Crushed Gravel',    'quantity' => 180,   'unit' => 'cu.m', 'material_unit_price' => 1200.00,'labor_unit_price' => 0, 'boq_item_id' => $p1b2->id]);

        // — Material Request 2 — APPROVED (masonry)
        $mr2 = MaterialRequest::create([
            'project_id' => $p1->id, 'requester_id' => $eng1->id, 'approver_id' => $pm->id,
            'request_date' => '2025-08-05 09:30:00', 'status' => 'APPROVED',
            'remarks' => 'Materials for Level 2 and Level 3 masonry works',
        ]);
        MaterialRequestItem::create(['material_request_id' => $mr2->id, 'item_description' => '4" Concrete Hollow Block', 'quantity' => 15000, 'unit' => 'pcs',  'material_unit_price' => 18.00,  'labor_unit_price' => 0, 'boq_item_id' => $p1b4->id]);
        MaterialRequestItem::create(['material_request_id' => $mr2->id, 'item_description' => 'Mortar Cement',            'quantity' => 600,   'unit' => 'bags', 'material_unit_price' => 285.00, 'labor_unit_price' => 0, 'boq_item_id' => $p1b4->id]);

        // — Purchase Request 1 — COMPLETED (foundation)
        $pr1 = PurchaseRequest::create([
            'project_id' => $p1->id, 'requester_id' => $proc->id, 'approver_id' => $pm->id,
            'request_date' => '2025-04-12 10:00:00', 'status' => 'COMPLETED',
            'purpose' => 'Procurement of foundation materials — cement and reinforcement bars for SM Lipa Phase 1 foundation works.',
            'total_estimated_cost' => 1_874_880.00,
        ]);
        $pr1i1 = PurchaseRequestItem::create(['purchase_request_id' => $pr1->id, 'item_description' => 'Portland Cement (40kg)',  'quantity' => 1620,  'ordered_quantity' => 1620,  'unit' => 'bags', 'estimated_unit_cost' =>  285.00, 'estimated_total_cost' =>  461_700.00]);
        $pr1i2 = PurchaseRequestItem::create(['purchase_request_id' => $pr1->id, 'item_description' => 'Deformed Bar 16mm x 6m', 'quantity' => 21600, 'ordered_quantity' => 21600, 'unit' => 'kg',   'estimated_unit_cost' =>   58.00, 'estimated_total_cost' => 1_252_800.00]);
        PurchaseRequestItem::create(                                              ['purchase_request_id' => $pr1->id, 'item_description' => '3/4" Crushed Gravel',    'quantity' => 180,   'ordered_quantity' => 180,   'unit' => 'cu.m', 'estimated_unit_cost' => 1200.00, 'estimated_total_cost' =>  216_000.00]);

        // — Purchase Request 2 — APPROVED (masonry)
        $pr2 = PurchaseRequest::create([
            'project_id' => $p1->id, 'requester_id' => $proc->id, 'approver_id' => $pm->id,
            'request_date' => '2025-08-07 08:30:00', 'status' => 'APPROVED',
            'purpose' => 'Procurement of masonry materials for Level 1 to Level 3 wall works.',
            'total_estimated_cost' => 441_000.00,
        ]);
        PurchaseRequestItem::create(['purchase_request_id' => $pr2->id, 'item_description' => '4" Concrete Hollow Block', 'quantity' => 15000, 'ordered_quantity' => 0, 'unit' => 'pcs',  'estimated_unit_cost' =>  18.00, 'estimated_total_cost' => 270_000.00]);
        PurchaseRequestItem::create(['purchase_request_id' => $pr2->id, 'item_description' => 'Mortar Cement',            'quantity' => 600,   'ordered_quantity' => 0, 'unit' => 'bags', 'estimated_unit_cost' => 285.00, 'estimated_total_cost' => 171_000.00]);

        // — PO 1 — COMPLETED  (cement → Holcim)
        $po1 = PurchaseOrder::create([
            'order_date' => '2025-04-15 09:00:00', 'project_id' => $p1->id,
            'purchase_request_id' => $pr1->id, 'supplier_id' => $holcim->id,
            'requester_id' => $proc->id, 'approver_id' => $pm->id,
            'status' => 'COMPLETED', 'total_amount' => 461_700.00,
            'remarks' => 'First delivery batch for foundation works.',
        ]);
        PurchaseOrderItem::create(['purchase_order_id' => $po1->id, 'purchase_request_item_id' => $pr1i1->id, 'material_name' => 'Portland Cement (40kg)', 'quantity' => 1620, 'unit' => 'bags', 'unit_price' => 285.00, 'total_price' => 461_700.00]);

        // — PO 2 — COMPLETED  (rebar → Pacific Steel)
        $po2 = PurchaseOrder::create([
            'order_date' => '2025-04-15 09:30:00', 'project_id' => $p1->id,
            'purchase_request_id' => $pr1->id, 'supplier_id' => $pacific->id,
            'requester_id' => $proc->id, 'approver_id' => $pm->id,
            'status' => 'COMPLETED', 'total_amount' => 1_252_800.00,
            'remarks' => 'Deformed bars for structural reinforcement.',
        ]);
        PurchaseOrderItem::create(['purchase_order_id' => $po2->id, 'purchase_request_item_id' => $pr1i2->id, 'material_name' => 'Deformed Bar 16mm x 6m', 'quantity' => 21600, 'unit' => 'kg', 'unit_price' => 58.00, 'total_price' => 1_252_800.00]);

        // — Receiving Reports —
        $rr1 = ReceivingReport::create(['purchase_order_id' => $po1->id, 'received_by_id' => $whm->id, 'received_date' => '2025-04-22 14:00:00', 'delivery_note_no' => 'DN-2025-04-0831', 'notes' => 'All bags in good condition. No wet or damaged bags.']);
        ReceivingItem::create(['receiving_report_id' => $rr1->id, 'material_name' => 'Portland Cement (40kg)', 'quantity_received' => 1620.00, 'status' => 'GOOD']);

        $rr2 = ReceivingReport::create(['purchase_order_id' => $po2->id, 'received_by_id' => $whm->id, 'received_date' => '2025-04-24 10:30:00', 'delivery_note_no' => 'DN-2025-04-0915', 'notes' => 'Deformed bars counted and verified. Minor surface rust on 50kg — accepted within tolerance.']);
        ReceivingItem::create(['receiving_report_id' => $rr2->id, 'material_name' => 'Deformed Bar 16mm x 6m', 'quantity_received' => 21600.00, 'status' => 'GOOD']);

        // — Inventory —
        $invCement1 = InventoryItem::create(['material_name' => 'Portland Cement (40kg)',  'project_id' => $p1->id, 'warehouse_id' => $mainWH->id, 'quantity' => 120.00,  'unit' => 'bags']);
        $invRebar1  = InventoryItem::create(['material_name' => 'Deformed Bar 16mm x 6m', 'project_id' => $p1->id, 'warehouse_id' => $mainWH->id, 'quantity' => 5400.00, 'unit' => 'kg']);

        // — Site Releases —
        SiteRelease::create([
            'inventory_item_id' => $invCement1->id, 'project_id' => $p1->id,
            'released_by_id' => $whm->id, 'issued_to' => 'Roberto Reyes — Foundation Team',
            'quantity_released' => 500.00, 'unit' => 'bags',
            'purpose' => 'Foundation concrete pour — Grid A to D, Level 1',
            'release_date' => '2025-05-05 07:00:00', 'status' => 'RECEIVED',
            'received_by_id' => $eng1->id, 'received_date' => '2025-05-05 08:30:00',
            'quantity_received' => 500.00, 'receipt_remarks' => 'Received complete. Stored on-site.',
        ]);
        SiteRelease::create([
            'inventory_item_id' => $invRebar1->id, 'project_id' => $p1->id,
            'released_by_id' => $whm->id, 'issued_to' => 'Roberto Reyes — Structural Team',
            'quantity_released' => 3000.00, 'unit' => 'kg',
            'purpose' => 'Column and beam reinforcement — Level 2 onwards',
            'release_date' => '2025-10-01 07:00:00', 'status' => 'IN_TRANSIT',
        ]);

        // — Finance: Invoice + Disbursement —
        $si1 = SupplierInvoice::create([
            'invoice_number' => 'HPI-2025-04-11843', 'invoice_date' => '2025-04-22 00:00:00',
            'supplier_id' => $holcim->id, 'purchase_order_id' => $po1->id,
            'receiving_report_id' => $rr1->id, 'recorded_by_id' => $fin->id,
            'total_amount' => 461_700.00, 'status' => 'PAID',
        ]);
        Disbursement::create([
            'purchase_order_id' => $po1->id, 'processed_by_id' => $fin->id,
            'amount' => 461_700.00, 'actual_amount' => 461_700.00,
            'payment_date' => '2025-05-15 10:00:00', 'method' => 'CHECK',
            'reference_number' => 'CHK-0042581', 'status' => 'LIQUIDATED',
            'received_by_id' => $admin->id, 'is_liquidated' => true,
            'liquidated_at' => '2025-05-20 14:00:00',
            'receipt_number' => 'OR-20250515-0042', 'receipt_date' => '2025-05-15',
            'liquidation_remarks' => 'Invoice fully paid and acknowledged by Holcim Philippines.',
        ]);

        // ══════════════════════════════════════════════════════════════════
        // PROJECT 2 — DPWH Batangas Circumferential Road Phase 2 (INFRASTRUCTURE, ONGOING)
        // Mid-workflow: partial delivery in progress
        // ══════════════════════════════════════════════════════════════════
        $p2 = Project::firstOrCreate(['name' => 'DPWH Batangas Circumferential Road - Phase 2'], [
            'client_id'        => $dpwh->id,
            'location'         => 'Batangas City, Batangas',
            'budget'           => 42_000_000.00,
            'status'           => 'ONGOING',
            'net_length'       => 4.20,
            'source_of_fund'   => 'GAA 2025',
            'project_type'     => 'INFRASTRUCTURE',
            'contract_type'    => 'Unit Price',
            'payment_terms'    => 'Progress Billing',
            'site_engineer_id' => $eng2->id,
            'target_start_date'=> '2025-06-01',
            'target_end_date'  => '2026-05-31',
            'duration_days'    => 365,
        ]);

        $p2b1 = $this->boqItem($p2, 'Clearing and Grubbing', 'ha', 3.50, 'SERVICE');
        $this->component($p2b1, 'LABOR',     'Clearing Labor',     'ha',  1.0,  25000.00, 25000.00, 20);
        $this->component($p2b1, 'EQUIPMENT', 'Bulldozer Rental',   'day', 2.0,  18000.00, 36000.00);

        $p2b2 = $this->boqItem($p2, 'Aggregate Subbase Course', 'cu.m', 8400, 'DIRECT_MATERIAL');
        $this->component($p2b2, 'MATERIAL',  'Crushed Aggregate Subbase', 'cu.m', 1.20, 1100.00, 1320.00);
        $this->component($p2b2, 'EQUIPMENT', 'Road Roller Rental',         'hr',   0.05, 3500.00,  175.00);
        $this->component($p2b2, 'LABOR',     'Subbase Compaction Labor',   'cu.m', 1.00,  120.00,  120.00, 10);

        $p2b3 = $this->boqItem($p2, 'Asphalt Concrete Pavement 50mm', 'sq.m', 16800, 'BUNDLE');
        $this->component($p2b3, 'MATERIAL',  'Asphalt Concrete Mix',  'ton',  0.12, 4800.00, 576.00);
        $this->component($p2b3, 'EQUIPMENT', 'Asphalt Paver Rental',  'hr',   0.01, 15000.00, 150.00);
        $this->component($p2b3, 'LABOR',     'Paving Works Labor',    'sq.m', 1.00,   85.00,  85.00, 15);

        $mr3 = MaterialRequest::create([
            'project_id' => $p2->id, 'requester_id' => $eng2->id, 'approver_id' => $pm->id,
            'request_date' => '2025-07-10 08:00:00', 'status' => 'PARTIALLY_FULFILLED',
            'remarks' => 'Initial subbase materials for Sta. 0+000 to 1+500.',
        ]);
        MaterialRequestItem::create(['material_request_id' => $mr3->id, 'item_description' => 'Crushed Aggregate Subbase', 'quantity' => 3000, 'unit' => 'cu.m', 'material_unit_price' => 1100.00, 'labor_unit_price' => 0, 'boq_item_id' => $p2b2->id]);

        $pr3 = PurchaseRequest::create([
            'project_id' => $p2->id, 'requester_id' => $proc->id, 'approver_id' => $pm->id,
            'request_date' => '2025-07-12 09:00:00', 'status' => 'PARTIAL',
            'purpose' => 'Aggregate subbase materials — road base preparation Sta. 0+000 to 1+500.',
            'total_estimated_cost' => 3_300_000.00,
        ]);
        $pr3i1 = PurchaseRequestItem::create(['purchase_request_id' => $pr3->id, 'item_description' => 'Crushed Aggregate Subbase', 'quantity' => 3000, 'ordered_quantity' => 1500, 'unit' => 'cu.m', 'estimated_unit_cost' => 1100.00, 'estimated_total_cost' => 3_300_000.00]);

        $po3 = PurchaseOrder::create([
            'order_date' => '2025-07-18 10:00:00', 'project_id' => $p2->id,
            'purchase_request_id' => $pr3->id, 'supplier_id' => $wilcon->id,
            'requester_id' => $proc->id, 'approver_id' => $pm->id,
            'status' => 'PARTIALLY DELIVERED', 'total_amount' => 3_300_000.00,
            'remarks' => 'First batch of 1,500 cu.m delivered. Remaining 1,500 cu.m scheduled for next delivery.',
        ]);
        PurchaseOrderItem::create(['purchase_order_id' => $po3->id, 'purchase_request_item_id' => $pr3i1->id, 'material_name' => 'Crushed Aggregate Subbase', 'quantity' => 3000, 'unit' => 'cu.m', 'unit_price' => 1100.00, 'total_price' => 3_300_000.00]);

        $rr3 = ReceivingReport::create(['purchase_order_id' => $po3->id, 'received_by_id' => $whm->id, 'received_date' => '2025-07-25 13:00:00', 'delivery_note_no' => 'DN-2025-07-2241', 'notes' => 'First batch: 1,500 cu.m. Gradation test samples taken for QC.']);
        ReceivingItem::create(['receiving_report_id' => $rr3->id, 'material_name' => 'Crushed Aggregate Subbase', 'quantity_received' => 1500.00, 'status' => 'GOOD']);

        $invSubbase = InventoryItem::create(['material_name' => 'Crushed Aggregate Subbase', 'project_id' => $p2->id, 'warehouse_id' => $mainWH->id, 'quantity' => 1500.00, 'unit' => 'cu.m']);
        SiteRelease::create([
            'inventory_item_id' => $invSubbase->id, 'project_id' => $p2->id,
            'released_by_id' => $whm->id, 'issued_to' => 'Jose Villanueva — Subbase Crew',
            'quantity_released' => 1500.00, 'unit' => 'cu.m',
            'purpose' => 'Subbase course placement Sta. 0+000 to 0+750',
            'release_date' => '2025-07-28 06:30:00', 'status' => 'IN_TRANSIT',
        ]);

        // ══════════════════════════════════════════════════════════════════
        // PROJECT 3 — Lipa City Flood Control & Drainage (INFRASTRUCTURE, COMPLETED)
        // All stages done — ideal for financial report demo
        // ══════════════════════════════════════════════════════════════════
        $p3 = Project::firstOrCreate(['name' => 'Lipa City Flood Control and Drainage Improvement'], [
            'client_id'        => $lguBatangas->id,
            'location'         => 'Lipa City, Batangas',
            'budget'           => 18_500_000.00,
            'status'           => 'COMPLETED',
            'net_length'       => 2.80,
            'source_of_fund'   => 'LGSF - Local Government Support Fund',
            'project_type'     => 'INFRASTRUCTURE',
            'contract_type'    => 'Lump Sum',
            'payment_terms'    => '30 days after billing',
            'site_engineer_id' => $eng2->id,
            'target_start_date'=> '2024-09-01',
            'target_end_date'  => '2025-03-31',
            'duration_days'    => 212,
        ]);

        $p3b1 = $this->boqItem($p3, 'Channel Excavation', 'cu.m', 2200, 'SERVICE');
        $this->component($p3b1, 'LABOR',     'Excavation Labor',        'cu.m', 1.00,  200.00,  200.00, 8);
        $this->component($p3b1, 'EQUIPMENT', 'Backhoe with Bucket',     'hr',   0.20, 2800.00,  560.00);

        $p3b2 = $this->boqItem($p3, 'RCCP 600mm Dia. Pipe Culvert', 'ln.m', 850, 'DIRECT_MATERIAL');
        $this->component($p3b2, 'MATERIAL', 'RCCP 600mm x 1.2m Pipe', 'pcs',  0.84, 3800.00, 3192.00);
        $this->component($p3b2, 'LABOR',    'Pipe Laying Labor',       'ln.m', 1.00,  350.00,  350.00, 6);

        $p3b3 = $this->boqItem($p3, 'Reinforced Concrete Headwall', 'each', 12, 'BUNDLE');
        $this->component($p3b3, 'MATERIAL', 'Portland Cement (40kg)', 'bags',  25.00,  285.00,  7125.00);
        $this->component($p3b3, 'MATERIAL', 'Deformed Bar 12mm',      'kg',   180.00,   55.00,  9900.00);
        $this->component($p3b3, 'LABOR',    'Headwall Construction',   'each',  1.00, 8000.00,  8000.00, 6);

        $mr4 = MaterialRequest::create(['project_id' => $p3->id, 'requester_id' => $eng2->id, 'approver_id' => $pm->id, 'request_date' => '2024-10-05 08:00:00', 'status' => 'FULFILLED', 'remarks' => 'Drainage pipes for initial installation phase.']);
        MaterialRequestItem::create(['material_request_id' => $mr4->id, 'item_description' => 'RCCP 600mm x 1.2m Pipe', 'quantity' => 714, 'unit' => 'pcs', 'material_unit_price' => 3800.00, 'labor_unit_price' => 0, 'boq_item_id' => $p3b2->id]);

        $mr5 = MaterialRequest::create(['project_id' => $p3->id, 'requester_id' => $eng2->id, 'approver_id' => $pm->id, 'request_date' => '2024-12-10 09:00:00', 'status' => 'FULFILLED', 'remarks' => 'Cement and rebar for headwall construction.']);
        MaterialRequestItem::create(['material_request_id' => $mr5->id, 'item_description' => 'Portland Cement (40kg)', 'quantity' => 300,  'unit' => 'bags', 'material_unit_price' =>  285.00, 'labor_unit_price' => 0, 'boq_item_id' => $p3b3->id]);
        MaterialRequestItem::create(['material_request_id' => $mr5->id, 'item_description' => 'Deformed Bar 12mm',     'quantity' => 2160, 'unit' => 'kg',   'material_unit_price' =>   55.00, 'labor_unit_price' => 0, 'boq_item_id' => $p3b3->id]);

        $pr4 = PurchaseRequest::create(['project_id' => $p3->id, 'requester_id' => $proc->id, 'approver_id' => $pm->id, 'request_date' => '2024-10-07 09:00:00', 'status' => 'COMPLETED', 'purpose' => 'Procurement of 600mm RCCP pipe culverts for drainage channel installation.', 'total_estimated_cost' => 2_713_200.00]);
        $pr4i1 = PurchaseRequestItem::create(['purchase_request_id' => $pr4->id, 'item_description' => 'RCCP 600mm x 1.2m Pipe', 'quantity' => 714, 'ordered_quantity' => 714, 'unit' => 'pcs', 'estimated_unit_cost' => 3800.00, 'estimated_total_cost' => 2_713_200.00]);

        $pr5 = PurchaseRequest::create(['project_id' => $p3->id, 'requester_id' => $proc->id, 'approver_id' => $pm->id, 'request_date' => '2024-12-12 08:30:00', 'status' => 'COMPLETED', 'purpose' => 'Cement and deformed bars for 12-unit reinforced concrete headwalls.', 'total_estimated_cost' => 204_300.00]);
        $pr5i1 = PurchaseRequestItem::create(['purchase_request_id' => $pr5->id, 'item_description' => 'Portland Cement (40kg)', 'quantity' => 300,  'ordered_quantity' => 300,  'unit' => 'bags', 'estimated_unit_cost' =>  285.00, 'estimated_total_cost' =>  85_500.00]);
        $pr5i2 = PurchaseRequestItem::create(['purchase_request_id' => $pr5->id, 'item_description' => 'Deformed Bar 12mm',     'quantity' => 2160, 'ordered_quantity' => 2160, 'unit' => 'kg',   'estimated_unit_cost' =>   55.00, 'estimated_total_cost' => 118_800.00]);

        $po4 = PurchaseOrder::create(['order_date' => '2024-10-10 10:00:00', 'project_id' => $p3->id, 'purchase_request_id' => $pr4->id, 'supplier_id' => $gmp->id, 'requester_id' => $proc->id, 'approver_id' => $pm->id, 'status' => 'COMPLETED', 'total_amount' => 2_713_200.00, 'remarks' => 'Complete delivery of RCCP pipes.']);
        PurchaseOrderItem::create(['purchase_order_id' => $po4->id, 'purchase_request_item_id' => $pr4i1->id, 'material_name' => 'RCCP 600mm x 1.2m Pipe', 'quantity' => 714, 'unit' => 'pcs', 'unit_price' => 3800.00, 'total_price' => 2_713_200.00]);

        $po5 = PurchaseOrder::create(['order_date' => '2024-12-15 09:00:00', 'project_id' => $p3->id, 'purchase_request_id' => $pr5->id, 'supplier_id' => $holcim->id, 'requester_id' => $proc->id, 'approver_id' => $pm->id, 'status' => 'COMPLETED', 'total_amount' => 204_300.00, 'remarks' => 'Cement and rebar for headwall works.']);
        PurchaseOrderItem::create(['purchase_order_id' => $po5->id, 'purchase_request_item_id' => $pr5i1->id, 'material_name' => 'Portland Cement (40kg)', 'quantity' => 300,  'unit' => 'bags', 'unit_price' =>  285.00, 'total_price' =>  85_500.00]);
        PurchaseOrderItem::create(['purchase_order_id' => $po5->id, 'purchase_request_item_id' => $pr5i2->id, 'material_name' => 'Deformed Bar 12mm',     'quantity' => 2160, 'unit' => 'kg',   'unit_price' =>   55.00, 'total_price' => 118_800.00]);

        $rr4 = ReceivingReport::create(['purchase_order_id' => $po4->id, 'received_by_id' => $whm->id, 'received_date' => '2024-10-18 09:00:00', 'delivery_note_no' => 'GMP-2024-10-0543', 'notes' => 'All 714 pipes received and inspected. Stacked on-site.']);
        ReceivingItem::create(['receiving_report_id' => $rr4->id, 'material_name' => 'RCCP 600mm x 1.2m Pipe', 'quantity_received' => 714.00, 'status' => 'GOOD']);

        $rr5 = ReceivingReport::create(['purchase_order_id' => $po5->id, 'received_by_id' => $whm->id, 'received_date' => '2024-12-18 14:00:00', 'delivery_note_no' => 'HPI-2024-12-22917', 'notes' => 'Cement and rebar received complete.']);
        ReceivingItem::create(['receiving_report_id' => $rr5->id, 'material_name' => 'Portland Cement (40kg)', 'quantity_received' =>  300.00, 'status' => 'GOOD']);
        ReceivingItem::create(['receiving_report_id' => $rr5->id, 'material_name' => 'Deformed Bar 12mm',     'quantity_received' => 2160.00, 'status' => 'GOOD']);

        $invPipe    = InventoryItem::create(['material_name' => 'RCCP 600mm x 1.2m Pipe', 'project_id' => $p3->id, 'warehouse_id' => $mainWH->id, 'quantity' => 0.00, 'unit' => 'pcs']);
        $invCement3 = InventoryItem::create(['material_name' => 'Portland Cement (40kg)', 'project_id' => $p3->id, 'warehouse_id' => $mainWH->id, 'quantity' => 0.00, 'unit' => 'bags']);

        SiteRelease::create(['inventory_item_id' => $invPipe->id, 'project_id' => $p3->id, 'released_by_id' => $whm->id, 'issued_to' => 'Jose Villanueva — Drainage Team', 'quantity_released' => 714.00, 'unit' => 'pcs', 'purpose' => 'Installation of 600mm RCCP drainage line — Sta. 0+000 to 0+850', 'release_date' => '2024-10-20 07:00:00', 'status' => 'RECEIVED', 'received_by_id' => $eng2->id, 'received_date' => '2024-10-20 09:00:00', 'quantity_received' => 714.00, 'receipt_remarks' => 'All pipes received on site.']);
        SiteRelease::create(['inventory_item_id' => $invCement3->id, 'project_id' => $p3->id, 'released_by_id' => $whm->id, 'issued_to' => 'Jose Villanueva — Headwall Team', 'quantity_released' => 300.00, 'unit' => 'bags', 'purpose' => 'Concrete for 12-unit reinforced headwall construction', 'release_date' => '2024-12-19 07:00:00', 'status' => 'RECEIVED', 'received_by_id' => $eng2->id, 'received_date' => '2024-12-19 08:30:00', 'quantity_received' => 300.00, 'receipt_remarks' => 'Received and stored on site.']);

        SupplierInvoice::create(['invoice_number' => 'GMP-INV-2024-10-0077', 'invoice_date' => '2024-10-18 00:00:00', 'supplier_id' => $gmp->id, 'purchase_order_id' => $po4->id, 'receiving_report_id' => $rr4->id, 'recorded_by_id' => $fin->id, 'total_amount' => 2_713_200.00, 'status' => 'PAID']);
        SupplierInvoice::create(['invoice_number' => 'HPI-INV-2024-12-09443', 'invoice_date' => '2024-12-18 00:00:00', 'supplier_id' => $holcim->id, 'purchase_order_id' => $po5->id, 'receiving_report_id' => $rr5->id, 'recorded_by_id' => $fin->id, 'total_amount' => 204_300.00, 'status' => 'PAID']);

        Disbursement::create(['purchase_order_id' => $po4->id, 'processed_by_id' => $fin->id, 'amount' => 2_713_200.00, 'actual_amount' => 2_713_200.00, 'payment_date' => '2024-11-18 10:00:00', 'method' => 'CHECK', 'reference_number' => 'CHK-0041092', 'status' => 'LIQUIDATED', 'received_by_id' => $admin->id, 'is_liquidated' => true, 'liquidated_at' => '2024-11-25 14:00:00', 'receipt_number' => 'OR-20241118-0091', 'receipt_date' => '2024-11-18', 'liquidation_remarks' => 'Fully liquidated. Invoice matched.']);
        Disbursement::create(['purchase_order_id' => $po5->id, 'processed_by_id' => $fin->id, 'amount' => 204_300.00, 'actual_amount' => 204_300.00, 'payment_date' => '2025-01-18 10:00:00', 'method' => 'ONLINE', 'reference_number' => 'INST-20250118-00881', 'status' => 'LIQUIDATED', 'received_by_id' => $admin->id, 'is_liquidated' => true, 'liquidated_at' => '2025-01-22 11:00:00', 'receipt_number' => 'OR-20250118-0014', 'receipt_date' => '2025-01-18', 'liquidation_remarks' => 'Paid via online transfer. OR received.']);

        // ══════════════════════════════════════════════════════════════════
        // PROJECT 4 — Cavite Residential Subdivision Phase 1 (BUILDING, PLANNING)
        // BOQ only — no procurement activity yet
        // ══════════════════════════════════════════════════════════════════
        $p4 = Project::firstOrCreate(['name' => 'Cavite Residential Subdivision - Phase 1'], [
            'client_id'        => $ayala->id,
            'location'         => 'Dasmarinas City, Cavite',
            'budget'           => 125_000_000.00,
            'status'           => 'PLANNING',
            'total_floor_area' => 58500.00,
            'source_of_fund'   => 'Project Financing',
            'project_type'     => 'BUILDING',
            'contract_type'    => 'Cost Plus',
            'payment_terms'    => '15 days after milestone',
            'site_engineer_id' => $eng1->id,
            'target_start_date'=> '2026-01-15',
            'target_end_date'  => '2028-06-30',
            'duration_days'    => 897,
        ]);

        $p4b1 = $this->boqItem($p4, 'Site Development and Grading', 'sq.m', 25000, 'SERVICE');
        $this->component($p4b1, 'LABOR',     'Site Grading Labor',     'sq.m', 1.00,   65.00,   65.00, 15);
        $this->component($p4b1, 'EQUIPMENT', 'Motor Grader Rental',    'hr',   0.01, 12000.00,  120.00);

        $p4b2 = $this->boqItem($p4, 'Residential Unit Foundation - Spread Footing', 'cu.m', 600, 'BUNDLE');
        $this->component($p4b2, 'MATERIAL', 'Portland Cement (40kg)', 'bags', 8.00,  285.00, 2280.00);
        $this->component($p4b2, 'MATERIAL', 'Washed Sand',            'cu.m', 0.50,  950.00,  475.00);
        $this->component($p4b2, 'MATERIAL', '3/4" Crushed Gravel',    'cu.m', 1.00, 1200.00, 1200.00);
        $this->component($p4b2, 'LABOR',    'Footing Concreting Labor','cu.m', 1.00,  850.00,  850.00, 5);

        $p4b3 = $this->boqItem($p4, 'Perimeter Fence - CHB 4" with Capstone', 'ln.m', 2800, 'BUNDLE');
        $this->component($p4b3, 'MATERIAL', '4" Concrete Hollow Block', 'pcs',  15.00,  18.00,  270.00);
        $this->component($p4b3, 'MATERIAL', 'Mortar Cement',            'bags',  0.80, 285.00,  228.00);
        $this->component($p4b3, 'LABOR',    'Masonry and Fence Labor',  'ln.m',  1.00, 280.00,  280.00, 4);

        // ══════════════════════════════════════════════════════════════════
        // PROJECT 5 — Tagaytay Highland Resort Hotel (BUILDING, ONGOING)
        // Early stage: BOQ complete, one MR pending approval
        // ══════════════════════════════════════════════════════════════════
        $p5 = Project::firstOrCreate(['name' => 'Tagaytay Highland Resort Hotel'], [
            'client_id'        => null,
            'location'         => 'Tagaytay City, Cavite',
            'budget'           => 68_000_000.00,
            'status'           => 'ONGOING',
            'total_floor_area' => 8200.00,
            'source_of_fund'   => 'Owner Equity',
            'project_type'     => 'BUILDING',
            'contract_type'    => 'Lump Sum',
            'payment_terms'    => '45 days net',
            'site_engineer_id' => $eng1->id,
            'target_start_date'=> '2025-09-01',
            'target_end_date'  => '2027-03-31',
            'duration_days'    => 577,
        ]);

        $p5b1 = $this->boqItem($p5, 'Bored Pile Foundation 600mm Dia.', 'ln.m', 420, 'BUNDLE');
        $this->component($p5b1, 'MATERIAL',  'Portland Cement (40kg)',    'bags', 12.00,  285.00, 3420.00);
        $this->component($p5b1, 'MATERIAL',  'Deformed Bar 25mm',         'kg',   95.00,   62.00, 5890.00);
        $this->component($p5b1, 'EQUIPMENT', 'Bored Pile Machine',        'ln.m',  1.00, 3500.00, 3500.00);
        $this->component($p5b1, 'LABOR',     'Bored Pile Concreting Labor','ln.m', 1.00,  800.00,  800.00, 8);

        $p5b2 = $this->boqItem($p5, 'Reinforced Concrete Structural Works', 'cu.m', 850, 'BUNDLE');
        $this->component($p5b2, 'MATERIAL', 'Portland Cement (40kg)', 'bags',   9.00,  285.00, 2565.00);
        $this->component($p5b2, 'MATERIAL', 'Washed Sand',            'cu.m',   0.50,  950.00,  475.00);
        $this->component($p5b2, 'MATERIAL', 'Deformed Bar 20mm',      'kg',   100.00,   60.00, 6000.00);
        $this->component($p5b2, 'LABOR',    'Structural Concrete Labor','cu.m',  1.00, 1200.00, 1200.00, 8);

        $p5b3 = $this->boqItem($p5, 'Exterior Glass Curtain Wall', 'sq.m', 1800, 'BUNDLE');
        $this->component($p5b3, 'MATERIAL', 'Tempered Glass 12mm',        'sq.m',  1.05, 2800.00, 2940.00);
        $this->component($p5b3, 'MATERIAL', 'Aluminum Frame System',      'ln.m',  4.00,  450.00, 1800.00);
        $this->component($p5b3, 'LABOR',    'Curtain Wall Installation',  'sq.m',  1.00,  750.00,  750.00, 6);

        $mr6 = MaterialRequest::create([
            'project_id' => $p5->id, 'requester_id' => $eng1->id, 'approver_id' => null,
            'request_date' => '2025-11-15 08:30:00', 'status' => 'PENDING',
            'remarks' => 'Materials needed for bored pile foundation — initial batch.',
        ]);
        MaterialRequestItem::create(['material_request_id' => $mr6->id, 'item_description' => 'Portland Cement (40kg)', 'quantity' => 5040,  'unit' => 'bags', 'material_unit_price' => 285.00, 'labor_unit_price' => 0, 'boq_item_id' => $p5b1->id]);
        MaterialRequestItem::create(['material_request_id' => $mr6->id, 'item_description' => 'Deformed Bar 25mm',     'quantity' => 39900, 'unit' => 'kg',   'material_unit_price' =>  62.00, 'labor_unit_price' => 0, 'boq_item_id' => $p5b1->id]);

        // ══════════════════════════════════════════════════════════════════
        // PROJECT 6 — Padre Garcia Farm-to-Market Road (INFRASTRUCTURE, ONGOING)
        // MR and PR approved, PO pending approval from PM
        // ══════════════════════════════════════════════════════════════════
        $p6 = Project::firstOrCreate(['name' => 'Padre Garcia Farm-to-Market Road'], [
            'client_id'        => $dpwh->id,
            'location'         => 'Padre Garcia, Batangas',
            'budget'           => 12_800_000.00,
            'status'           => 'ONGOING',
            'net_length'       => 3.20,
            'source_of_fund'   => 'DPWH RCEF 2025',
            'project_type'     => 'INFRASTRUCTURE',
            'contract_type'    => 'Unit Price',
            'payment_terms'    => 'Progress Billing',
            'site_engineer_id' => $eng2->id,
            'target_start_date'=> '2025-08-15',
            'target_end_date'  => '2026-02-28',
            'duration_days'    => 197,
        ]);

        $p6b1 = $this->boqItem($p6, 'Clearing and Grubbing', 'ha', 1.80, 'SERVICE');
        $this->component($p6b1, 'LABOR',     'Clearing Labor',   'ha',  1.00, 22000.00, 22000.00, 12);
        $this->component($p6b1, 'EQUIPMENT', 'Bulldozer Rental', 'day', 1.50, 18000.00, 27000.00);

        $p6b2 = $this->boqItem($p6, 'Aggregate Subbase Course', 'cu.m', 1800, 'DIRECT_MATERIAL');
        $this->component($p6b2, 'MATERIAL',  'Crushed Aggregate Subbase', 'cu.m', 1.20, 1050.00, 1260.00);
        $this->component($p6b2, 'EQUIPMENT', 'Road Roller',               'hr',   0.05, 3200.00,  160.00);
        $this->component($p6b2, 'LABOR',     'Subbase Compaction Labor',  'cu.m', 1.00,  110.00,  110.00, 8);

        $p6b3 = $this->boqItem($p6, 'Portland Cement Concrete Pavement 200mm', 'sq.m', 5500, 'BUNDLE');
        $this->component($p6b3, 'MATERIAL', 'Portland Cement (40kg)', 'bags', 9.50,  285.00, 2707.50);
        $this->component($p6b3, 'MATERIAL', 'Washed Sand',            'cu.m', 0.50,  900.00,  450.00);
        $this->component($p6b3, 'MATERIAL', '3/4" Crushed Gravel',    'cu.m', 0.90, 1100.00,  990.00);
        $this->component($p6b3, 'LABOR',    'Concrete Pavement Labor','sq.m', 1.00,  350.00,  350.00, 12);

        $mr7 = MaterialRequest::create([
            'project_id' => $p6->id, 'requester_id' => $eng2->id, 'approver_id' => $pm->id,
            'request_date' => '2025-09-10 08:00:00', 'status' => 'APPROVED',
            'remarks' => 'Cement and gravel for initial concrete pavement section Sta. 0+000 to 0+500.',
        ]);
        MaterialRequestItem::create(['material_request_id' => $mr7->id, 'item_description' => 'Portland Cement (40kg)', 'quantity' => 5225, 'unit' => 'bags', 'material_unit_price' => 285.00, 'labor_unit_price' => 0, 'boq_item_id' => $p6b3->id]);
        MaterialRequestItem::create(['material_request_id' => $mr7->id, 'item_description' => '3/4" Crushed Gravel',   'quantity' =>  495, 'unit' => 'cu.m', 'material_unit_price' => 1100.00,'labor_unit_price' => 0, 'boq_item_id' => $p6b3->id]);

        $pr6 = PurchaseRequest::create([
            'project_id' => $p6->id, 'requester_id' => $proc->id, 'approver_id' => $pm->id,
            'request_date' => '2025-09-12 09:00:00', 'status' => 'APPROVED',
            'purpose' => 'Cement and gravel for concrete pavement Sta. 0+000 to 0+500 — Padre Garcia FMR.',
            'total_estimated_cost' => 2_033_625.00,
        ]);
        PurchaseRequestItem::create(['purchase_request_id' => $pr6->id, 'item_description' => 'Portland Cement (40kg)', 'quantity' => 5225, 'ordered_quantity' => 0, 'unit' => 'bags', 'estimated_unit_cost' =>  285.00, 'estimated_total_cost' => 1_489_125.00]);
        PurchaseRequestItem::create(['purchase_request_id' => $pr6->id, 'item_description' => '3/4" Crushed Gravel',   'quantity' =>  495, 'ordered_quantity' => 0, 'unit' => 'cu.m', 'estimated_unit_cost' => 1100.00, 'estimated_total_cost' =>   544_500.00]);

        $po6 = PurchaseOrder::create([
            'order_date' => '2025-09-15 10:00:00', 'project_id' => $p6->id,
            'purchase_request_id' => $pr6->id, 'supplier_id' => $eagle->id,
            'requester_id' => $proc->id, 'approver_id' => null,
            'status' => 'PENDING', 'total_amount' => 1_489_125.00,
            'remarks' => null,
        ]);
        PurchaseOrderItem::create(['purchase_order_id' => $po6->id, 'material_name' => 'Portland Cement (40kg)', 'quantity' => 5225, 'unit' => 'bags', 'unit_price' => 285.00, 'total_price' => 1_489_125.00]);
    }

    // ──────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────

    private function user(string $name, string $username, string $email, string $role): User
    {
        $user = User::firstOrCreate(['email' => $email], [
            'name'     => $name,
            'username' => $username,
            'password' => Hash::make('password'),
            'role'     => $role,
            'is_active'=> true,
        ]);
        $user->syncRoles([$role]);
        return $user;
    }

    private function supplier(string $name, string $contact, string $email, string $phone, string $address): Supplier
    {
        return Supplier::firstOrCreate(['name' => $name], [
            'contact_person' => $contact,
            'email'          => $email,
            'phone'          => $phone,
            'address'        => $address,
            'is_active'      => true,
        ]);
    }

    private function boqItem(Project $project, string $description, string $unit, float $quantity, string $nature): BoqItem
    {
        return BoqItem::firstOrCreate(
            ['project_id' => $project->id, 'item_description' => $description],
            ['unit' => $unit, 'quantity' => $quantity, 'material_unit_price' => 0, 'labor_unit_price' => 0, 'is_carport' => false, 'nature' => $nature]
        );
    }

    private function component(BoqItem $item, string $type, string $name, string $unit, float $factor, float $rate, float $cost, ?float $persons = null, ?float $hours = null): BoqItemComponent
    {
        return BoqItemComponent::create([
            'boq_item_id'     => $item->id,
            'resource_type'   => $type,
            'name'            => $name,
            'unit'            => $unit,
            'quantity_factor' => $factor,
            'unit_rate'       => $rate,
            'total_cost'      => $cost,
            'no_of_persons'   => $persons,
            'hours'           => $hours,
        ]);
    }
}
