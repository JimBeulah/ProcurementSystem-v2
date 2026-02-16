<?php

use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\BoqController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\FinanceFormController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MaterialRequestController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\ReceivingController;
use App\Http\Controllers\ReceivingFormController;
use App\Http\Controllers\RfqController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SiteReleaseController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Clients
    Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');

    // Projects
    Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
    Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store');
    Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
    Route::put('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update');
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy');

    // BOQ
    Route::get('/projects/{project}/boq', [BoqController::class, 'index'])->name('projects.boq');
    Route::post('/projects/{project}/boq', [BoqController::class, 'store'])->name('projects.boq.store');
    Route::post('/projects/{project}/boq/bulk', [BoqController::class, 'bulkStore'])->name('projects.boq.bulk');
    Route::put('/projects/{project}/boq/{boqItem}', [BoqController::class, 'update'])->name('projects.boq.update');
    Route::delete('/projects/{project}/boq/{boqItem}', [BoqController::class, 'destroy'])->name('projects.boq.destroy');
    Route::post('/projects/{project}/boq/approve', [BoqController::class, 'approve'])->name('projects.boq.approve');

    // BOQ Components / DUPA
    Route::post('/projects/{project}/boq/{boqItem}/components', [BoqController::class, 'storeComponent'])->name('projects.boq.components.store');
    Route::put('/projects/{project}/boq/components/{boqComponent}', [BoqController::class, 'updateComponent'])->name('projects.boq.components.update');
    Route::delete('/projects/{project}/boq/components/{boqComponent}', [BoqController::class, 'destroyComponent'])->name('projects.boq.components.destroy');


    // Material Requests
    Route::get('/projects/{project}/material-requests', [MaterialRequestController::class, 'index'])->name('projects.material-requests');
    Route::post('/projects/{project}/material-requests', [MaterialRequestController::class, 'store'])->name('projects.material-requests.store');
    Route::post('/material-requests/{materialRequest}/approve', [MaterialRequestController::class, 'approve'])->name('material-requests.approve');
    Route::post('/material-requests/{materialRequest}/reject', [MaterialRequestController::class, 'reject'])->name('material-requests.reject');

    // Purchase Orders
    Route::get('/purchasing/orders', [PurchaseOrderController::class, 'index'])->name('purchasing.orders.index');
    Route::get('/purchasing/orders/create', [PurchaseOrderController::class, 'create'])->name('purchasing.orders.create');
    Route::post('/purchasing/orders', [PurchaseOrderController::class, 'store'])->name('purchasing.orders.store');
    Route::get('/purchasing/orders/{order}', [PurchaseOrderController::class, 'show'])->name('purchasing.orders.show');
    Route::post('/purchasing/orders/{order}/approve', [PurchaseOrderController::class, 'approve'])->name('purchasing.orders.approve');

    // RFQ
    Route::get('/purchasing/rfq', [RfqController::class, 'index'])->name('purchasing.rfq.index');
    Route::get('/purchasing/rfq/create', [RfqController::class, 'create'])->name('purchasing.rfq.create');
    Route::post('/purchasing/rfq', [RfqController::class, 'store'])->name('purchasing.rfq.store');
    Route::get('/purchasing/rfq/{rfq}', [RfqController::class, 'show'])->name('purchasing.rfq.show');
    Route::post('/purchasing/rfq/{rfq}/quotation', [RfqController::class, 'addQuotation'])->name('purchasing.rfq.quotation');
    Route::post('/purchasing/rfq/{rfq}/award/{quotation}', [RfqController::class, 'award'])->name('purchasing.rfq.award');

    // Purchase Requests
    Route::get('/purchasing/requests', [PurchaseRequestController::class, 'index'])->name('purchasing.requests.index');

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');

    // Receiving / GRN
    Route::get('/inventory/receiving', [ReceivingController::class, 'index'])->name('receiving.index');

    // Finance
    Route::get('/finance/invoices', [FinanceController::class, 'invoices'])->name('finance.invoices');
    Route::get('/finance/disbursements', [FinanceController::class, 'disbursements'])->name('finance.disbursements');
    Route::get('/finance/reports', [FinanceController::class, 'reports'])->name('finance.reports');

    // Approvals
    Route::get('/purchasing/approvals', [ApprovalController::class, 'index'])->name('purchasing.approvals');

    // Receiving Create
    Route::get('/inventory/receiving/create', [ReceivingFormController::class, 'create'])->name('receiving.create');
    Route::post('/inventory/receiving', [ReceivingFormController::class, 'store'])->name('receiving.store');

    // Finance Forms
    Route::get('/finance/invoices/create', [FinanceFormController::class, 'createInvoice'])->name('finance.invoices.create');
    Route::post('/finance/invoices', [FinanceFormController::class, 'storeInvoice'])->name('finance.invoices.store');
    Route::get('/finance/disbursements/create', [FinanceFormController::class, 'createDisbursement'])->name('finance.disbursements.create');
    Route::post('/finance/disbursements', [FinanceFormController::class, 'storeDisbursement'])->name('finance.disbursements.store');

    // Site Release
    Route::get('/site-release', [SiteReleaseController::class, 'index'])->name('site-release.index');

    // Settings
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::get('/settings/users', [SettingsController::class, 'users'])->name('settings.users');
    Route::get('/settings/master-data', [SettingsController::class, 'masterData'])->name('settings.master-data');
    Route::get('/settings/workflows', [SettingsController::class, 'workflows'])->name('settings.workflows');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';

Route::get('/test-flash', function () {
    return redirect()->route('login')->with('success', 'Sonner is working perfectly!');
});
