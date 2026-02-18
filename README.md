# ProcurementSystem-v2

![Spatie Permission](https://img.shields.io/badge/Spatie-Permission-purple?style=flat-square&logo=laravel)
![Inertia.js](https://img.shields.io/badge/Inertia.js-2.0-blueviolet?style=flat-square&logo=inertia)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-12.0-FF2D20?style=flat-square&logo=laravel&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

A comprehensive procurement management system built with **Laravel 12**, **Inertia.js**, and **React**. Designed to streamline project workflows, manage Bill of Quantities (BOQ), and handle material requests with strict budget control.

## 🚀 Key Features

- **Role-Based Access Control (RBAC)**: secure access management powered by `spatie/laravel-permission`.
- **Project Management**: Comprehensive project tracking and management.
- **Bill of Quantities (BOQ)**: detailed BOQ management with itemized tracking.
- **Material Requests**: Request workflow with budget and quantity validation against BOQ limits.
- **Modern UI**: macOS-inspired interface featuring glassmorphism, dark/light mode support, and smooth interactions.
- **Real-time Feedback**: Instant validation and toast notifications using `sonner`.

## 🛠 Tech Stack

- **Backend**: Laravel 12
- **Frontend**: React 18, Inertia.js 2.0
- **Styling**: Tailwind CSS, PostCSS
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Database**: MySQL / MariaDB (via Laragon)
- **Local Environment**: Laragon (recommended on Windows)

## 📦 Prerequisites

Ensure you have the following installed:

- PHP >= 8.2
- Composer
- Node.js & NPM
- MySQL

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ProcurementSystem-v2.git
   cd ProcurementSystem-v2
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Install JavaScript dependencies**
   ```bash
   npm install
   ```

4. **Environment Configuration**
   Copy the example environment file and configure your database settings.
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your database credentials:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=procurementsystem_v2
   DB_USERNAME=root
   DB_PASSWORD=
   ```

5. **Generate Application Key**
   ```bash
   php artisan key:generate
   ```

6. **Run Migrations & Seeders**
   Set up the database schema and populate it with initial data (roles, permissions, etc.).
   ```bash
   php artisan migrate --seed
   ```

7. **Build Assets**
   Compile frontend assets for development.
   ```bash
   npm run dev
   ```

8. **Start local server**
   ```bash
   php artisan serve
   ```

## 📖 Usage

- **Admin Login**: Access the system with administrative credentials (check `DatabaseSeeder.php` for default users).
- **Manage Roles**: Assign permissions to users via the RBAC interface.
- **Create Projects**: Start by creating a project and importing/creating its BOQ.
- **Material Requests**: Users can submit requests which are validated against the project's BOQ budget.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
