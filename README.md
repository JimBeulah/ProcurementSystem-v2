<div align="center">

![ProcureFlow Banner](public/banner.png)

# 🚀 ProcureFlow
### **The Ultimate Enterprise Procurement & Inventory Intelligence System**

[![Laravel](https://img.shields.io/badge/Laravel-13.0+-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.0+-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**ProcureFlow** is a next-generation procurement ecosystem designed to transform how organizations manage materials, vendors, and project financials. Built with a focus on **speed, precision, and enterprise-grade security**, it bridges the gap between site operations and back-office management.

[Explore Features](#-project-highlights) • [Installation](#-quick-start) • [Architecture](#-system-architecture) • [Developer](#-developed-by)

</div>

---

## 💎 Project Highlights

ProcureFlow isn't just a management tool; it's an operational powerhouse.

### 🏗️ Construction-First Intelligence
Specifically engineered for large-scale projects. Track every nut, bolt, and man-hour from the initial **Bill of Quantities (BOQ)** to the final site dispatch.

### 🛒 Dynamic Purchasing Engine
- **Vendor Management**: Maintain a verified list of suppliers with performance tracking.
- **Smart Approvals**: Multi-level, role-based approval workflows for Purchase Requests and Orders.
- **Print-Ready Documents**: Generate professional, formatted PDFs for POs and reports instantly.

### 📦 Precision Inventory
- **GRN Integration**: Automated Goods Receiving Notes linked directly to Purchase Orders.
- **Warehouse to Site**: Seamless dispatch queue with digital confirmation of receipt.
- **Return Logistics**: Handle site-to-warehouse and supplier returns with full traceability.

### 💰 Financial Oversight
- **Real-time Cost Analysis**: Monitor actual vs. budgeted costs at the BOQ component level.
- **Disbursement Control**: Manage petty cash, advances, and liquidations with ease.
- **Audit Trails**: Every action is logged, ensuring 100% accountability.

---

## 🛠️ Modern Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Core** | ![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=flat-square&logo=php&logoColor=white) | Robust Server-side Logic |
| **Framework** | ![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?style=flat-square&logo=laravel&logoColor=white) | Rapid & Secure API Development |
| **Frontend** | ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black) | Dynamic & Responsive User Interface |
| **Bridge** | ![Inertia](https://img.shields.io/badge/Inertia.js-2.0-9553E9?style=flat-square&logo=inertia&logoColor=white) | The Modern Monolith Experience |
| **Styling** | ![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Utility-first Design Language |
| **Animations** | ![Framer](https://img.shields.io/badge/Framer_Motion-12-0055FF?style=flat-square&logo=framer&logoColor=white) | Premium Micro-interactions |

---

## ⚡ Quick Start

Get ProcureFlow running on your local machine in under 5 minutes.

### 1️⃣ Clone & Enter
```bash
git clone https://github.com/JimBeulah/ProcurementSystem-v2.git
cd ProcurementSystem-v2
```

### 2️⃣ Install Core Dependencies
```bash
composer install
npm install
```

### 3️⃣ Initialize Environment
```bash
cp .env.example .env
php artisan key:generate
```
> [!TIP]
> Update your `DB_*` variables in `.env` before proceeding to the next step.

### 4️⃣ Database & Seeds
```bash
php artisan migrate --seed
```

### 5️⃣ Fire it up!
```bash
composer run dev
```

---

## 📐 System Architecture

### **The "ProcureFlow" Data Flow**
```mermaid
graph LR
    A[Site Engineer] -- Material Request --> B(Purchasing)
    B -- Purchase Order --> C{Supplier}
    C -- Delivery --> D[Warehouse]
    D -- Site Release --> A
    B -- Invoice --> E((Finance))
    E -- Payment --> C
```

### **Folder Blueprint**
```text
├── app/                  # The Heart (Controllers, Models, Services)
├── database/             # The Memory (Migrations, Seeders)
├── resources/js/         # The Face (React Components, Pages)
│   ├── Components/       # Reusable UI Atoms
│   ├── Layouts/          # Structural Shells
│   └── Pages/            # View Templates
└── routes/               # The Nervous System (Web & API endpoints)
```

---

## 🛡️ Security & Performance

- **Sanctum Authentication**: Secure API and SPA authentication.
- **Spatie RBAC**: Detailed role-level security.
- **Queue Workers**: Heavy tasks (PDF generation, Emails) are handled in the background.
- **Vite Optimization**: Lightning-fast frontend builds.

---

## 👨‍💻 Developed By

<div align="left">

**Nelmarjim Luna**
*Lead Architect & Full Stack Developer*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/nelmarjim-luna)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/JimBeulah)

</div>

---

<div align="center">
Built with passion for efficient procurement.
</div>
