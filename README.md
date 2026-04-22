# Procurement System v2

Procurement System v2 is a comprehensive project management and procurement platform designed to track the entire lifecycle of construction or organizational projects. From initial budgeting (BOQ) to material requests, purchase orders, inventory management, and financial reconciliation, it provides a centralized hub for all procurement-related activities.

## Key Features

- **Project Management & BOQ**: Detailed budget tracking with elements, items, and resource components (Material, Labor, Equipment).
- **Purchasing Workflow**: multi-stage approval processes for Material Requests (MR), Purchase Requests (PR), and Purchase Orders (PO).
- **Inventory & Site Management**: Real-time tracking of Goods Receipt Notes (GRN), site releases, and returns.
- **Finance Integration**: Logging supplier invoices, tracking disbursements, and generating budget vs. actual reports.
- **Role-Based Access Control**: Granular permissions for Admins, Site Engineers, Procurement Officers, and Finance Managers.
- **Audit Trails**: Full activity logging for accountability and transparency.

## Tech Stack

- **Backend**: [Laravel 12.x](https://laravel.com/) (PHP 8.2+)
- **Frontend**: [Inertia.js](https://inertiajs.com/) with [React 18](https://react.dev/)
- **Build Tool**: [Vite 7](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) & [GSAP](https://gsap.com/)
- **Database**: PostgreSQL (Recommended for production), MySQL/MariaDB, or SQLite (Development)
- **State Management**: React Hooks & Inertia Page Props
- **Testing**: [PHPUnit](https://phpunit.de/) (Unit/Feature) & [Playwright](https://playwright.dev/) (E2E)
- **Deployment**: [Vercel](https://vercel.com/) (configured via `vercel.json`)

## Prerequisites

- **PHP 8.2** or higher
- **Node.js 20** or higher
- **Composer**
- **npm** or **yarn**
- **SQLite**, **PostgreSQL**, or **MySQL**

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ProcurementSystem-v2.git
cd ProcurementSystem-v2
```

### 2. Install PHP Dependencies

```bash
composer install
```

### 3. Install JavaScript Dependencies

```bash
npm install
```

### 4. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Generate the application key:

```bash
php artisan key:generate
```

### 5. Database Setup

Create a database (if using MySQL/PostgreSQL) and update the `DB_*` variables in your `.env` file. By default, it's configured for SQLite.

Run the migrations and seeders:

```bash
php artisan migrate --seed
```

This will set up the necessary tables and populate the system with default roles, permissions, and an admin user.

### 6. Start Development Server

Run both the Laravel server and the Vite dev server concurrently:

```bash
npm run dev
```

The application will be available at [http://localhost:8000](http://localhost:8000).

## Architecture

### Directory Structure

```
├── app/
│   ├── Http/
│   │   ├── Controllers/    # Web and API controllers
│   │   ├── Middleware/     # Auth, Permission, and ForcePasswordChange
│   │   └── Requests/       # Form validation logic
│   ├── Models/             # Eloquent models (Project, BoqItem, PurchaseOrder, etc.)
│   ├── Policies/           # Authorization logic for resources
│   ├── Services/           # Business logic extraction (Procurement, Finance, etc.)
│   └── Notifications/      # System notifications (PO Approved, etc.)
├── database/
│   ├── migrations/         # Database schema definitions
│   └── seeders/            # Default roles, permissions, and sample data
├── resources/
│   ├── js/
│   │   ├── Pages/          # Inertia React components
│   │   ├── Components/     # Reusable UI components (shadcn/ui)
│   │   └── Layouts/        # Shared page layouts
│   └── css/                # Tailwind CSS entry point
├── routes/
│   ├── web.php             # Main web routes (Inertia)
│   ├── api.php             # API routes (Sanctum)
│   └── auth.php            # Authentication routes (Breeze)
├── docs/                   # Extended documentation and system architecture
└── public/                 # Static assets and Vite build output
```

### Key Modules

1.  **BOQ Module**: Manages the "Bill of Quantities". Items are linked to projects and have components (Materials, Labor, Equipment).
2.  **Procurement Module**: Handles the MR -> PR -> PO flow. Includes budget checking against the BOQ.
3.  **Inventory Module**: Tracks physical goods entering the warehouse (Receiving) and leaving for site (Site Release).
4.  **Finance Module**: Connects procurement to the ledger via Invoices and Disbursements.

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_NAME` | Name of the application | `Laravel` |
| `APP_ENV` | Application environment | `local` |
| `DB_CONNECTION` | Database driver | `sqlite` |
| `SESSION_DRIVER` | Session storage driver | `database` |
| `QUEUE_CONNECTION` | Queue driver | `database` |
| `CACHE_STORE` | Cache driver | `database` |

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs Laravel server, Vite dev, and queues concurrently |
| `npm run build` | Compiles assets for production |
| `php artisan migrate` | Runs database migrations |
| `php artisan db:seed` | Seeds the database |
| `php artisan test` | Runs PHPUnit tests |
| `npm run test:e2e` | Runs Playwright E2E tests |

## Testing

### Running Unit & Feature Tests

```bash
php artisan test
```

### Running E2E Tests (Playwright)

```bash
npx playwright test
```

For the UI mode:

```bash
npx playwright test --ui
```

## Deployment

### Vercel (Recommended)

This project is pre-configured for deployment on Vercel using the `vercel-php` runtime.

1.  Connect your repository to Vercel.
2.  Set the environment variables in the Vercel dashboard.
3.  Ensure `APP_KEY` is set.
4.  Vercel will automatically detect `vercel.json` and deploy.

### Manual / VPS

1.  Clone the repo.
2.  Run `composer install --optimize-autoloader --no-dev`.
3.  Run `npm install && npm run build`.
4.  Set up Nginx/Apache to point to the `public/` directory.
5.  Run migrations: `php artisan migrate --force`.

## Troubleshooting

- **Vite Build Failures**: Ensure you are using Node.js 20+. Try clearing `node_modules` and re-installing.
- **Permission Denied (Storage)**: Ensure the `storage` and `bootstrap/cache` directories are writable by the web server.
- **Database Connection**: Check `.env` for correct credentials. For SQLite, ensure `database/database.sqlite` exists.

---

Built with ❤️ for efficient procurement management.
