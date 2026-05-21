<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Http\Controllers\BoqController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DatabaseManagementController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\FinanceFormController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\MaterialRequestController;
use App\Http\Controllers\MaterialReturnController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OperationsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\ReceivingController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SiteReleaseController;
use App\Http\Controllers\StorageController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierReturnController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

// Force Password Change — accessible by authenticated users only (exempt from password.changed itself)
Route::middleware(['auth'])->group(function () {
    Route::get('/password/change', [ForcePasswordChangeController::class, 'show'])->name('password.change');
    Route::post('/password/change', [ForcePasswordChangeController::class, 'update'])->name('password.change.update');

    // Notifications
    Route::post('/notifications/{notification}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');
    Route::post('/notifications/clear-all', [NotificationController::class, 'clearAll'])->name('notifications.clear-all');

    // Storage
    Route::post('/storage/upload', [StorageController::class, 'handleUpload'])->name('storage.upload');
});

Route::middleware(['auth', 'verified', 'password.changed'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Clients
    Route::middleware(['can:view clients'])->group(function () {
        Route::get('/clients', [ClientController::class, 'index'])->name('clients.index');
        Route::post('/clients', [ClientController::class, 'store'])->name('clients.store')->middleware('can:manage clients');
        Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update')->middleware('can:manage clients');
        Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy')->middleware('can:manage clients');
    });

    // Projects
    Route::middleware(['can:view projects'])->group(function () {
        Route::get('/projects', [ProjectController::class, 'index'])->name('projects.index');
        Route::get('/projects/{project}', [ProjectController::class, 'show'])->name('projects.show');
        Route::get('/projects/{project}/financials', [ProjectController::class, 'financials'])->name('projects.financials');

        Route::post('/projects', [ProjectController::class, 'store'])->name('projects.store')->middleware('can:create projects');
        Route::put('/projects/{project}', [ProjectController::class, 'update'])->name('projects.update')->middleware('can:edit projects');
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy'])->name('projects.destroy')->middleware('can:delete projects');
    });

    // BOQ
    Route::middleware(['can:view boq'])->group(function () {
        Route::get('/projects/{project}/boq', [BoqController::class, 'index'])->name('projects.boq');

        Route::middleware(['can:manage boq'])->group(function () {
            Route::post('/projects/{project}/boq', [BoqController::class, 'store'])->name('projects.boq.store');
            Route::post('/projects/{project}/boq/bulk', [BoqController::class, 'bulkStore'])->name('projects.boq.bulk');
            Route::post('/projects/{project}/boq/smart-import/analyze', [\App\Http\Controllers\SmartBoqImportController::class, 'analyze'])->name('projects.boq.smart-import.analyze');
            Route::post('/projects/{project}/boq/smart-import/confirm', [\App\Http\Controllers\SmartBoqImportController::class, 'confirm'])->name('projects.boq.smart-import.confirm');
            Route::put('/projects/{project}/boq/{boqItem}', [BoqController::class, 'update'])->name('projects.boq.update');
            Route::delete('/projects/{project}/boq/{boqItem}', [BoqController::class, 'destroy'])->name('projects.boq.destroy');
            Route::post('/projects/{project}/boq/{boqItem}/components', [BoqController::class, 'storeComponent'])->name('projects.boq.components.store');
            Route::put('/projects/{project}/boq/components/{boqComponent}', [BoqController::class, 'updateComponent'])->name('projects.boq.components.update');
            Route::delete('/projects/{project}/boq/components/{boqComponent}', [BoqController::class, 'destroyComponent'])->name('projects.boq.components.destroy');
        });

        Route::post('/projects/{project}/boq/approve', [BoqController::class, 'approve'])->name('projects.boq.approve')->middleware('can:approve boq');
        Route::post('/projects/{project}/boq/revise', [BoqController::class, 'revise'])->name('projects.boq.revise')->middleware('can:approve boq');
    });

    // Material Requests & Returns
    Route::middleware(['can:view material requests'])->group(function () {
        Route::get('/projects/{project}/material-requests', [MaterialRequestController::class, 'index'])->name('projects.material-requests');
        Route::post('/projects/{project}/material-requests', [MaterialRequestController::class, 'store'])->name('projects.material-requests.store')->middleware('can:create material requests');
        Route::post('/material-requests/{materialRequest}/approve', [MaterialRequestController::class, 'approve'])->name('material-requests.approve')->middleware('can:approve material requests');
        Route::post('/material-requests/{materialRequest}/reject', [MaterialRequestController::class, 'reject'])->name('material-requests.reject')->middleware('can:reject material requests');
        Route::post('/material-requests/{materialRequest}/cancel', [MaterialRequestController::class, 'cancel'])->name('material-requests.cancel');

        // Site Engineer project-specific material returns view
        Route::get('/projects/{project}/material-returns', [ProjectController::class, 'materialReturns'])->name('projects.material-returns');
    });

    // Purchase Orders
    Route::middleware(['can:view purchase orders'])->group(function () {
        Route::get('/purchasing/orders', [PurchaseOrderController::class, 'index'])->name('purchasing.orders.index');
        Route::get('/purchasing/orders/create', [PurchaseOrderController::class, 'create'])->name('purchasing.orders.create')->middleware('can:create purchase orders');
        Route::post('/purchasing/orders', [PurchaseOrderController::class, 'store'])->name('purchasing.orders.store')->middleware('can:create purchase orders');
        Route::get('/purchasing/orders/{order}', [PurchaseOrderController::class, 'show'])->name('purchasing.orders.show');
        Route::get('/purchasing/orders/{order}/print', [PurchaseOrderController::class, 'print'])->name('purchasing.orders.print');
        Route::post('/purchasing/orders/{order}/approve', [PurchaseOrderController::class, 'approve'])->name('purchasing.orders.approve')->middleware('can:approve purchase orders');
        Route::post('/purchasing/orders/{order}/decline', [PurchaseOrderController::class, 'decline'])->name('purchasing.orders.decline')->middleware('can:approve purchase orders');
        Route::post('/purchasing/orders/{order}/cancel', [PurchaseOrderController::class, 'cancel'])->name('purchasing.orders.cancel')->middleware('can:create purchase orders');
    });

    // Suppliers
    Route::middleware(['can:view suppliers'])->group(function () {
        Route::get('/purchasing/suppliers', [SupplierController::class, 'index'])->name('purchasing.suppliers.index');
        Route::post('/purchasing/suppliers', [SupplierController::class, 'store'])->name('purchasing.suppliers.store')->middleware('can:manage suppliers');
        Route::put('/purchasing/suppliers/{supplier}', [SupplierController::class, 'update'])->name('purchasing.suppliers.update')->middleware('can:manage suppliers');
        Route::patch('/purchasing/suppliers/{supplier}/toggle-active', [SupplierController::class, 'toggleActive'])->name('purchasing.suppliers.toggle-active')->middleware('can:manage suppliers');
    });

    // Purchase Requests
    Route::middleware(['can:view purchase requests'])->group(function () {
        Route::get('/purchasing/requests', [PurchaseRequestController::class, 'index'])->name('purchasing.requests.index');
        Route::post('/purchasing/requests', [PurchaseRequestController::class, 'store'])->name('purchasing.requests.store')->middleware('can:create purchase requests');
        Route::get('/purchasing/requests/{purchaseRequest}/print', [PurchaseRequestController::class, 'print'])->name('purchasing.requests.print');

        Route::middleware(['can:manage purchase requests'])->group(function () {
            Route::post('/purchasing/requests/{purchaseRequest}/approve', [PurchaseRequestController::class, 'approve'])->name('purchasing.requests.approve');
            Route::post('/purchasing/requests/{purchaseRequest}/decline', [PurchaseRequestController::class, 'decline'])->name('purchasing.requests.decline');
            Route::delete('/purchasing/requests/{purchaseRequest}', [PurchaseRequestController::class, 'destroy'])->name('purchasing.requests.destroy');
        });
    });

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index')->middleware('can:view inventory');
    Route::post('/inventory', [InventoryController::class, 'store'])->name('inventory.store')->middleware('can:manage inventory');
    Route::put('/inventory/{inventoryItem}', [InventoryController::class, 'update'])->name('inventory.update')->middleware('can:manage inventory');

    // Receiving / GRN
    Route::get('/inventory/receiving', [ReceivingController::class, 'index'])->name('receiving.index')->middleware('role_or_permission:site_engineer|view receiving');
    Route::get('/inventory/receiving/create', [ReceivingController::class, 'create'])->name('receiving.create')->middleware('role_or_permission:site_engineer|create receiving');
    Route::post('/inventory/receiving', [ReceivingController::class, 'store'])->name('receiving.store')->middleware('role_or_permission:site_engineer|create receiving');
    Route::post('/inventory/receiving/{purchaseOrder}/auto', [ReceivingController::class, 'autoReceive'])->name('receiving.auto')->middleware('role_or_permission:site_engineer|create receiving');

    // Finance
    Route::get('/finance/invoices', [FinanceController::class, 'invoices'])->name('finance.invoices')->middleware('can:view invoices');
    Route::get('/finance/disbursements', [FinanceController::class, 'disbursements'])->name('finance.disbursements')->middleware('can:view disbursements');
    Route::get('/finance/reports', [FinanceController::class, 'reports'])->name('finance.reports')->middleware('can:view financial reports');
    Route::get('/finance/reports/print', [FinanceController::class, 'print'])->name('finance.reports.print');

    // Finance Actions
    Route::middleware(['can:manage invoices'])->group(function () {
        Route::post('/finance/invoices', [FinanceFormController::class, 'storeInvoice'])->name('finance.invoices.store');
        Route::post('/finance/invoices/{invoice}/validate', [FinanceFormController::class, 'validateInvoice'])->name('finance.invoices.validate');
    });

    Route::middleware(['can:manage disbursements'])->group(function () {
        Route::post('/finance/disbursements', [FinanceFormController::class, 'storeDisbursement'])->name('finance.disbursements.store');
        Route::post('/finance/disbursements/{disbursement}/liquidate', [FinanceFormController::class, 'liquidate'])->name('finance.disbursements.liquidate');
    });

    // Approvals
    Route::get('/purchasing/approvals', [ApprovalController::class, 'index'])
        ->name('purchasing.approvals')
        ->middleware('can:view purchase orders');

    // Operations
    Route::get('/operations/deliveries', [OperationsController::class, 'deliveries'])->name('operations.deliveries')->middleware('role_or_permission:site_engineer|view receiving');

    // Site Release (Warehouse Dispatch Queue)
    Route::get('/site-release', [SiteReleaseController::class, 'index'])->name('site-release.index')->middleware('can:view site release');
    Route::post('/site-release/{siteRelease}/dispatch', [SiteReleaseController::class, 'dispatch'])->name('site-release.dispatch')->middleware('can:create site release');
    Route::post('/site-release/{siteRelease}/confirm', [SiteReleaseController::class, 'confirmReceipt'])->name('site-release.confirm')->middleware('can:confirm site release');
    Route::post('/site-release', [SiteReleaseController::class, 'store'])->name('site-release.store')->middleware('can:create site release');

    // Material Returns (Site → Warehouse)
    Route::get('/inventory/returns', [MaterialReturnController::class, 'index'])->name('material-returns.index')->middleware('can:view inventory');
    Route::post('/inventory/returns', [MaterialReturnController::class, 'store'])->name('material-returns.store')->middleware('can:view site release');
    Route::post('/inventory/returns/{materialReturn}/receive', [MaterialReturnController::class, 'receive'])->name('material-returns.receive')->middleware('can:manage inventory');

    // Supplier Returns (Wrong Purchase / Return-to-Vendor)
    Route::middleware(['can:view purchase orders'])->group(function () {
        Route::get('/purchasing/supplier-returns', [SupplierReturnController::class, 'index'])->name('supplier-returns.index');
        Route::get('/purchasing/supplier-returns/create', [SupplierReturnController::class, 'create'])->name('supplier-returns.create')->middleware('can:create purchase orders');
        Route::post('/purchasing/supplier-returns', [SupplierReturnController::class, 'store'])->name('supplier-returns.store')->middleware('can:create purchase orders');
        Route::get('/purchasing/supplier-returns/{supplierReturn}', [SupplierReturnController::class, 'show'])->name('supplier-returns.show');
        Route::post('/purchasing/supplier-returns/{supplierReturn}/approve', [SupplierReturnController::class, 'approve'])->name('supplier-returns.approve')->middleware('can:approve purchase orders');
        Route::post('/purchasing/supplier-returns/{supplierReturn}/mark-returned', [SupplierReturnController::class, 'markReturned'])->name('supplier-returns.mark-returned')->middleware('can:approve purchase orders');
        Route::post('/purchasing/supplier-returns/{supplierReturn}/cancel', [SupplierReturnController::class, 'cancel'])->name('supplier-returns.cancel')->middleware('can:create purchase orders');
    });

    // Settings & Profile (Accessible to all authenticated users)
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::get('/settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Restricted Settings
    Route::middleware(['can:view settings'])->group(function () {
        Route::get('/settings/workflows', [SettingsController::class, 'workflows'])->name('settings.workflows');
    });

    // User Management (Admin only)
    Route::middleware(['can:manage users'])->group(function () {
        Route::get('/settings/users', [SettingsController::class, 'users'])->name('settings.users');
        Route::post('/settings/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/settings/users/{user}', [UserController::class, 'update'])->name('users.update');
        Route::patch('/settings/users/{user}/toggle-active', [UserController::class, 'toggleActive'])->name('users.toggle-active');
        Route::patch('/settings/users/{user}/reset-password', [UserController::class, 'resetPassword'])->name('users.reset-password');
    });

    // Activity Logs (Admin only)
    Route::middleware(['role:admin'])->group(function () {
        Route::get('/activity-logs', [ActivityLogController::class, 'index'])->name('activity-logs.index');

        // Database Management
        Route::get('/settings/database', [DatabaseManagementController::class, 'index'])->name('settings.database.index');
        Route::get('/settings/database/backup', [DatabaseManagementController::class, 'backup'])->name('settings.database.backup');
        Route::post('/settings/database/import', [DatabaseManagementController::class, 'import'])->name('settings.database.import');
        Route::post('/settings/database/reset', [DatabaseManagementController::class, 'reset'])->name('settings.database.reset');
    });
});

require __DIR__.'/auth.php';

Route::get('/test-flash', function () {
    return redirect()->route('login')->with('success', 'Sonner is working perfectly!');
});
