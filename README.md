# ProcurementSystem-v2

![Spatie Permission](https://img.shields.io/badge/Spatie-Permission-purple?style=flat-square&logo=laravel)
![Inertia.js](https://img.shields.io/badge/Inertia.js-2.0-blueviolet?style=flat-square&logo=inertia)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-12.0-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

A comprehensive procurement management system built with **Laravel 12**, **Inertia.js**, and **React**. Designed to streamline project workflows, manage Bill of Quantities (BOQ), and handle material requests with strict budget control.

## Key Features

- **Role-Based Access Control (RBAC)**: secure access management powered by `spatie/laravel-permission`.
- **Project Management**: Comprehensive project tracking and management.
- **Bill of Quantities (BOQ)**: detailed BOQ management with itemized tracking.
- **Material & Purchase Requests**: Request workflow with budget and quantity validation against BOQ limits and Supplier management.- **Finance & Inventory**: Tracks GRN, receiving, site release, invoices, and disbursements.
- **Modern UI**: macOS-inspired interface featuring glassmorphism, dark/light mode support, smooth interactions, and integrated charts via `recharts`.
- **Real-time Feedback**: Instant validation and toast notifications using `sonner`.

---

## Tech Stack

- **Language**: PHP 8.2+
- **Framework**: Laravel 12.0+
- **Frontend**: React 18, Inertia.js 2.0
- **Styling**: Tailwind CSS (Tailwind Vite Plugin) + PostCSS
- **State/Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Database**: MySQL / MariaDB (via Laragon) / SQLite
- **Local Environment**: Laragon (recommended on Windows)

---

## Prerequisites

Ensure you have the following installed on your local machine:

- PHP >= 8.2 (with appropriate extensions like pdo, sqlite3, mbstring)
- Composer
- Node.js & NPM
- MySQL / MariaDB (optional if using SQLite)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ProcurementSystem-v2.git
cd ProcurementSystem-v2
```

### 2. Auto-Setup (Recommended)

The project includes a unified setup script inside `composer.json` that handles installing dependencies, setting up your `.env`, generating an app key, migrating the database, and building assets:

```bash
composer setup
```

**What this does behind the scenes:**
1. `composer install` (Installs PHP packages)
2. Copies `.env.example` to `.env` if it doesn't exist
3. `php artisan key:generate` (Generates application key)
4. `php artisan migrate --force` (Runs database migrations)
5. `npm install` (Installs JS packages)
6. `npm run build` (Compiles Vite assets)

### 3. Manual Setup (Alternative)

If you prefer to run the commands manually:

```bash
# Install PHP dependencies
composer install

# Install JavaScript dependencies
npm install

# Environment Configuration
cp .env.example .env

# Generate Application Key
php artisan key:generate

# Build Assets
npm run build
```

**Environment Configuration (.env):**
Update `.env` with your database credentials. For SQLite, `DB_CONNECTION=sqlite` is the default. For MySQL via Laragon:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=procurementsystem_v2
DB_USERNAME=root
DB_PASSWORD=
```

### 4. Database Seeding

Set up the database schema and populate it with initial data (roles, permissions, default users, master data).

```bash
php artisan migrate --seed
```

### 5. Start Development Server

Run the development server which utilizes `concurrently` to spin up your PHP server, queue listener, log viewer, and Vite dev server all at once!

```bash
composer dev
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## Architecture Overview

### Directory Structure

```text
├── app/
│   ├── Http/Controllers/      # Core logic (ProjectController, BoqController, etc.)
│   ├── Models/                # Eloquent Models (User, Project, PurchaseOrder, etc.)
│   └── Providers/             # Service Provider configurations
├── bootstrap/                 # Application bootstrap
├── config/                    # Configuration files
├── database/
│   ├── factories/             # Database model factories
│   ├── migrations/            # Table creation schemas
│   └── seeders/               # Initial data population (Roles, Admin User)
├── resources/
│   ├── js/                    # React frontend components and Inertia set up
│   └── views/                 # Blade views, mainly the Inertia root template `app.blade.php`
├── routes/
│   ├── web.php                # Application route definitions (authenticated vs guest)
│   └── auth.php               # Authentication routes
└── public/                    # Compiled assets and uploads (entry point)
```

### Request Lifecycle

1. **Routing:** Request hits `routes/web.php` and passes through middleware (auth, permission checks).
2. **Controller:** Route executes a specific controller (e.g., `MaterialRequestController@store`).
3. **Data Access:** Controller interacts with the Database through Eloquent Models.
4. **Response:** Controller returns data using `Inertia::render('Component/Path', [...props])`.
5. **Frontend Rendering:** Inertia intercepts the request and cleanly injects the props into the target React component without doing a full page reload.

### Key Components

- **Authentication & Authorization:**
  - Login/Register capabilities natively through Laravel Breeze-inspired configurations.
  - Spatie Permission middleware (`can:view projects`, `role:admin`) governs robust endpoint security.
- **Inertia.js Integration:**
  - Full client-side SPA capabilities utilizing server-side routing.
- **Frontend Stack:**
  - Components heavily utilize Tailwind CSS alongside Radix UI/Headless UI concepts (lucide-react icons, sonner toasts) wrapped in Framer Motion animations.

---

## Environment Variables

### Required
| Variable             | Description                       | How to Get                             |
| -------------------- | --------------------------------- | -------------------------------------- |
| `DB_CONNECTION`      | Database driver (mysql, sqlite)   | Your database provider / Laragon setup |
| `APP_KEY`            | Laravel secret for encryption     | Run `php artisan key:generate`         |

### Optional
| Variable            | Description                                       | Default                      |
| ------------------- | ------------------------------------------------- | ---------------------------- |
| `APP_URL`           | Base URL of your application                      | `http://localhost`           |
| `LOG_CHANNELS`      | Logging behavior setup                            | `stack`                      |

---

## Available Scripts

| Command                       | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `composer setup`              | Full automated local project setup process (dependencies -> db) |
| `composer dev`                | Start dev environment (Artisan serve + Vite + Queue listen)     |
| `composer test`               | Run the Pest/PHPUnit test suite and clear config                |
| `php artisan migrate`         | Run all pending migrations                                      |
| `php artisan migrate:fresh`   | Drop all tables and re-run all migrations                       |
| `npm run dev`                 | Just run the Vite hot-module-replacement wrapper                |
| `npm run build`               | Compile assets down for production                              |

---

## Testing

The application supports both PHPUnit and Pest natively based on the Laravel 12 configuration.

### Running Tests

```bash
# Run all tests using Composer alias script
composer test

# Alternatively, run tests using Artisan
php artisan test
```

---

## Deployment

### General Considerations

1. Ensure the webroot points to the `public/` directory.
2. The folder structure requires proper permissions for the `storage/` and `bootstrap/cache/` directories:
   ```bash
   chmod -R 775 storage bootstrap/cache
   ```

### Deployment Steps (VPS / Manual)

```bash
# 1. Pull latest code
git pull origin main

# 2. Install PHP dependencies optimally
composer install --optimize-autoloader --no-dev

# 3. Install NPM dependencies and trigger a production build
npm install
npm run build

# 4. Migrate database
php artisan migrate --force

# 5. Clear and Cache Configurations
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
```

---

## Troubleshooting

### Database Connection Issues
**Error:** `sqlstate[hy000] [2002] connection refused`
**Solution:**
1. Verify `DB_HOST` and `DB_PORT` in your `.env`. If using Laragon, ensure MySQL is actively running in the manager UI.
2. If utilizing SQLite, ensure the `database/database.sqlite` file actually exists.

### Asset Loading / Styling Issues
**Error:** Webpage displays without styling or javascript behavior.
**Solution:**
Vite has likely not compiled the assets.
Run `npm run build` once, or start the dev server via `composer dev`.

### Migration Errors
**Error:** `Table already exists` or FK constraint issues
**Solution:**
If on a local environment and data isn't critical, execute a fresh migration:
```bash
php artisan migrate:fresh --seed
```

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
