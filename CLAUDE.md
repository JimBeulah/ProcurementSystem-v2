# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
composer run dev          # Starts all services concurrently: Laravel server, queue worker, and Vite
```
This runs `php artisan serve`, `php artisan queue:listen --tries=1 --timeout=0`, and `npm run dev` in parallel.

### Building
```bash
npm run build             # Production Vite build
```

### Testing
```bash
composer run test         # Clears config cache, then runs PHPUnit (uses in-memory SQLite)
php artisan test --filter=BoqAdditionTest   # Run a single test class
npm run test:e2e          # Playwright E2E tests (requires server at localhost:8000)
npm run test:e2e:ui       # Playwright with interactive UI
```

### Code Quality
```bash
npm run lint              # ESLint on resources/js
vendor/bin/pint           # Laravel Pint (PHP code style)
```

### Database
```bash
php artisan migrate --seed    # Run migrations and all seeders
php artisan db:seed --class=RolesAndPermissionsSeeder   # Re-seed roles/permissions only
```

## Architecture

### Stack
Laravel 13 (PHP 8.3) + Inertia.js 2 + React 18. No separate API layer — Inertia renders React pages server-driven. Tailwind CSS 3 for styling, Framer Motion for animations, Sonner for toast notifications.

### Laravel Layer

**Controllers → Services pattern**: Controllers in `app/Http/Controllers/` handle HTTP concerns and delegate business logic to corresponding `app/Services/` classes (e.g., `BoqController` → `BoqService`, `MaterialRequestController` → `MaterialRequestService`). Keep controllers thin.

**Authorization**: Uses `spatie/laravel-permission` for RBAC. Roles: `admin`, `project_manager`, `site_engineer`, `warehouse`, `procurement_officer`, `finance`. Routes are guarded with `middleware(['can:permission-name'])`. The `RolesAndPermissionsSeeder` is the source of truth for all roles and permissions.

**Activity Logging**: Models use `spatie/laravel-activitylog` via the `LogsActivity` trait. Call `logOnly([...fields...])` with `logOnlyDirty()` on each model.

**Enums**: Status fields use PHP 8.1 backed enums in `app/Enums/` (`MaterialRequestStatus`, `PurchaseOrderStatus`, `PurchaseRequestStatus`, `SiteReleaseStatus`). Cast them in model `casts()`.

**Notifications**: `app/Notifications/` contains database+mail notifications sent at workflow transitions (approval, submission, etc.).

**PDF generation**: `barryvdh/laravel-dompdf` for PO/PR print views. `phpoffice/phpspreadsheet` for Excel exports.

**File storage**: `VercelBlobService` handles file uploads to Vercel Blob. A `StorageController` provides the upload endpoint.

### React / Inertia Layer

**Page resolution**: `app.jsx` resolves pages from `resources/js/Pages/**/*.jsx`.

**Layout**: `AuthenticatedLayout` wraps all authenticated pages. It reads `NAVIGATION_CONFIG` from `resources/js/Config/Navigation.jsx` to build the sidebar and sub-navigation tabs. Navigation items declare `permission` (or `anyPermission`) fields that are evaluated client-side.

**Permission checking in React**: Use the `usePermissions()` hook (`resources/js/Hooks/usePermissions.js`). It reads `auth.roles` and `auth.permissions` from Inertia shared props. Admins always pass all permission checks.

**UI components**: Reusable components live in `resources/js/Components/UI/`. Domain-specific components are organized by feature under `resources/js/Components/` (e.g., `Boq/`, `MaterialRequest/`).

**Styling utilities**: `resources/js/Utils/cn.js` exports a `cn()` helper (clsx + tailwind-merge). Always use `cn()` for conditional class composition.

### Data Model Relationships

The core data flow: `Project` → `BoqItem` → `BoqItemComponent` (the resource breakdown) → `MaterialRequest` → `PurchaseRequest` → `PurchaseOrder` → `ReceivingReport` → `InventoryItem` → `SiteRelease`.

**BOQ cost model**: `BoqItemComponent` stores both `client_unit_rate`/`client_total_cost` (what the client pays) and `altapil_unit_rate`/`altapil_total_cost` (internal cost). `BoqItem.recalculateTotals()` is called automatically via model `booted()` hooks whenever a component is saved or deleted. `resource_type` values: `MATERIAL`, `LABOR`, `EQUIPMENT`.

**Project scoping for site_engineers**: `Project::scopeForUser()` filters projects to only those where the user is the `site_engineer_id` or a `ProjectMember`. Apply this scope in controllers when the authenticated user has the `site_engineer` role.

**Soft deletes**: `Project`, `MaterialRequest`, `BoqItem` use `SoftDeletes`. `BoqItem` has a unique constraint scoped to non-deleted records.

### Testing

PHPUnit tests live in `tests/Feature/` (uses in-memory SQLite, configured in `phpunit.xml`). Playwright E2E tests are in `tests/e2e/`. Feature tests cover BOQ operations, material request budget validation, and smart BOQ import.

## Git

**Never auto-commit.** Always ask the user before running `git commit`. Only commit when explicitly instructed.
