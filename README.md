# Procurement System v2

![Laravel](https://img.shields.io/badge/Laravel-12.0-FF2D20?style=for-the-badge&logo=laravel)
![Inertia.js](https://img.shields.io/badge/Inertia.js-2.0-9553E9?style=for-the-badge&logo=inertia)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

A comprehensive procurement and project management system designed to streamline the lifecycle of construction and organizational projects. From initial budgeting (BOQ) to material requests, purchasing, inventory management, and final financial disbursement.

## Key Features

- **Project & BOQ Management**: Detailed Bill of Quantities (BOQ) tracking with itemized resource components (Material, Labor, Equipment).
- **Strict Budget Control**: Real-time validation of material requests against BOQ limits to prevent over-budgeting.
- **Multi-stage Procurement**: Workflow moving from Material Requests (MR) to Purchase Requests (PR) and finalized Purchase Orders (PO).
- **Inventory & Warehouse**: Tracks Goods Receipt Notes (GRN), centralized inventory, and site-specific releases.
- **Financial Tracking**: Management of supplier invoices, disbursements, and project-level financial reporting.
- **Robust RBAC**: Granular role-based access control powered by `spatie/laravel-permission`.
- **Modern UI/UX**: macOS-inspired interface featuring glassmorphism, dark/light mode, and smooth animations via Framer Motion & GSAP.

---

## Tech Stack

- **Framework**: [Laravel 12.0](https://laravel.com)
- **Frontend**: [React 18](https://reactjs.org), [Inertia.js 2.0](https://inertiajs.com)
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com) (with Vite integration)
- **Animations**: [Framer Motion 12](https://www.framer.com/motion/), [GSAP](https://gsap.com)
- **State/Table**: [TanStack Table v8](https://tanstack.com/table)
- **Charts**: [Recharts](https://recharts.org)
- **Icons**: [Lucide React](https://lucide.dev)
- **Notifications**: [Sonner](https://sonner.steventey.com)
- **Permissions**: [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)

---

## Prerequisites

- **PHP**: ^8.2
- **Node.js**: ^20.0
- **Composer**: ^2.0
- **Database**: MySQL 8.0+, MariaDB, or SQLite
- **Environment**: Laragon (recommended for Windows users)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/ProcurementSystem-v2.git
cd ProcurementSystem-v2
```

### 2. Automated Setup

The project includes a unified setup script that handles dependency installation, environment configuration, key generation, and migrations:

```bash
composer setup
```

**What this script does:**
1. `composer install` (PHP dependencies)
2. Generates `.env` from `.env.example`
3. `php artisan key:generate`
4. `php artisan migrate --force`
5. `npm install` (JS dependencies)
6. `npm run build` (Production assets)

### 3. Database Seeding (Optional)

To populate the system with default roles, permissions, and master data:

```bash
php artisan migrate --seed
```

### 4. Start Development Server

We use `concurrently` to run the Laravel server, Vite, and background processes in a single terminal:

```bash
composer dev
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## Architecture Overview

### Directory Structure

```text
├── app/
│   ├── Http/
│   │   ├── Controllers/    # Inertia-ready controllers
│   │   ├── Requests/       # Form validation logic
│   │   └── Middleware/     # Permission & Role checks
│   ├── Models/             # Eloquent Models (Project, BoqItem, PO, etc.)
│   ├── Services/           # Business logic (FinanceService, ReceivingService)
│   └── Notifications/      # System alerts (Project deadlines, Approval requests)
├── database/
│   ├── migrations/         # Database schema definitions
│   └── seeders/            # Roles, Permissions, and Master Data
├── docs/                   # Detailed module and architecture documentation
├── resources/
│   ├── js/                 # React application root
│   │   ├── Pages/          # Inertia page components
│   │   ├── Components/     # Reusable UI elements (shadcn-based)
│   │   └── Layouts/        # Application layouts (Authenticated/Guest)
│   └── views/              # Root Blade templates
└── routes/
    ├── web.php             # Main application routes
    └── api.php             # API endpoints (if any)
```

### Core Workflow

1.  **Project Creation**: A client and project are registered.
2.  **BOQ Entry**: Detailed items and components are added to the project budget.
3.  **Material Request (MR)**: Site engineers request materials. The system validates against BOQ quantity/budget.
4.  **Purchase Order (PO)**: Procurement converts requests into orders for suppliers.
5.  **Receiving (GRN)**: Warehouse logs delivered items.
6.  **Site Release**: Materials are dispatched to the project site.
7.  **Liquidation**: Finance logs invoices and processes disbursements.

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DB_CONNECTION` | Database driver | `mysql` |
| `DB_DATABASE` | Database name | `procurementsystem_v2` |
| `APP_ENV` | Application environment | `local` |
| `APP_DEBUG` | Debug mode | `true` |

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `composer setup` | Full project initialization |
| `composer dev` | Start development environment (Server + Vite + Queue) |
| `composer test` | Run Pest/PHPUnit test suite |
| `npm run build` | Compile assets for production |
| `php artisan migrate:fresh --seed` | Wipe database and re-seed with default data |

---

## Deployment

1.  **Server Requirements**: PHP 8.2+, MySQL 8.0+.
2.  **Permissions**: Ensure `storage` and `bootstrap/cache` are writable.
3.  **Optimization**:
    ```bash
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    ```
4.  **Process Management**: Use Supervisor to manage the queue worker:
    ```bash
    php artisan queue:work
    ```

---

## Troubleshooting

### Database Issues
If you encounter `Connection refused`, ensure your DB service is running (e.g., MySQL in Laragon). For SQLite, ensure `database/database.sqlite` exists.

### UI Not Updating
If changes in React components aren't reflecting, ensure `npm run dev` or `composer dev` is running. For production, run `npm run build`.

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout -b feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
