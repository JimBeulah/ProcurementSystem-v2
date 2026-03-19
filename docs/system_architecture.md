# System Architecture: Procurement System v2

## 1. Technology Stack

- **Backend Framework**: Laravel 11 (PHP)
- **Frontend Framework**: React.js 18
- **Frontend Bridging**: Inertia.js (Monolithic SPA approach)
- **Styling**: Tailwind CSS & shadcn/ui components
- **Database**: MySQL / MariaDB (via Eloquent ORM)
- **Authentication**: Laravel Breeze / Sanctum with Spatie Permission for Role-Based Access Control
- **Animations**: Framer Motion / Custom CSS transitions

## 2. Architecture Pattern

The system follows a **Monolithic Model-View-Controller (MVC)** architecture, enhanced by Inertia.js to provide a Single Page Application (SPA) experience without needing a separate standalone API layer.

### 2.1 Backend (Laravel)
- **Models**: Handle data representation and database interactions. They house business logic and relationships (e.g., `Project` has many `BoqItem`s).
- **Controllers**: Act as the entry points for HTTP requests. They validate input (via `FormRequests`), authorize actions (via `Policies`), and pass data to Inertia views.
- **Middleware**: Used heavily for route-level protection based on Roles and Permissions (e.g., `can:view projects`).
- **Services (Optional)**: Complex business logic (like PO auto-receiving) is extracted into service classes to keep controllers thin.

### 2.2 Frontend (React + Inertia)
- **Pages**: Top-level React components located in `resources/js/Pages`. Each corresponds to a specific Laravel route controller method.
- **Components**: Reusable UI elements located in `resources/js/Components`. The system heavily relies on `shadcn/ui` for accessible, styled base components.
- **State Management**: Handled primarily through component-level state (`useState`, `useReducer`) and Inertia's page props. Global state is minimized by utilizing Inertia's data fetching model.

## 3. Core Data Flow Diagram

```mermaid
graph TD
    subgraph Client [Browser (React + Inertia)]
        UI[User Interface]
        Pages[Page Components]
        UI -->|Interacts| Pages
    end

    subgraph Server [Laravel Backend]
        Routes[Web Routes]
        Auth[Auth & Policies]
        Controllers[Controllers]
        Models[Eloquent Models]
    end

    Database[(MySQL Database)]

    Pages -->|HTTP/Inertia Request| Routes
    Routes --> Auth
    Auth -->|Authorized| Controllers
    Controllers -->|Query/Mutate| Models
    Models <--> Database
    Controllers -->|Inertia Response| Pages
```

## 4. Security & Authorization

The system utilizes a robust and granular permission structure:
- **Roles**: e.g., Admin, Site Engineer, Procurement Officer, Finance Manager.
- **Permissions**: Granular actions (e.g., `create purchase orders`, `approve boq`).
- **Policies**: Laravel Model Policies ensure that users can only modify resources they have access to or own.

All critical modifications require validation via Form Requests before hitting the database.
