# Procurement System v2 - Project Plan & Gantt Chart

This document outlines the high-level project plan and timeline for the development of Procurement System v2.

## Project Phases

### Phase 1: Foundation & Setup
- System requirements and database schema design.
- Setup of Laravel backend and React/Inertia frontend.
- Implementation of Authentication and Role-Based Access Control (RBAC).

### Phase 2: Core Project Modules
- **Foundation Settings**: System configuration and User management.
- **Client & Project Management**: Creating projects and assigning them to clients.
- **Bill of Quantities (BOQ)**: Granular itemized budgeting for projects (labor, materials, equipment).

### Phase 3: Procurement Workflows
- **Material Requests**: Requesting items required for a project.
- **Purchase Requests (PR)**: Internal requests to buy materials.
- **Suppliers**: Manage supplier contacts and details.
- **Purchase Orders (PO)**: Officially ordering materials with multi-level approval workflows.

### Phase 4: Inventory & Finance
- **Inventory Receiving**: Goods Receipt Notes (GRN) upon delivery.
- **Material Returns**: Handling defective or excess items.
- **Site Releases**: Moving inventory to active project sites.
- **Finance**: Invoicing, Disbursements, and Financial Reporting.

### Phase 5: Polish & Deployment
- Security Audits (Authorization Policies).
- UI/UX Refinements (Animations, Responsive Design).
- Final Deployment and documentation.

## Gantt Chart

```mermaid
gantt
    title Procurement System v2 Development Lifecycle
    dateFormat  YYYY-MM-DD
    
    section Phase 1: Foundation
    Requirements Gathering & Design   :done,    des1, 2025-01-01, 14d
    Database Architecture             :done,    des2, after des1, 14d
    Authentication & RBAC Setup       :done,    des3, after des2, 7d
    
    section Phase 2: Core Modules
    Foundation Settings               :done,    dev1, after des3, 10d
    Projects & Client Management      :done,    dev2, after dev1, 14d
    Bill of Quantities (BOQ)          :done,    dev3, after dev2, 14d
    
    section Phase 3: Procurement Flow
    Material & Purchase Requests      :done,    dev4, after dev3, 14d
    Supplier Management               :done,    dev5, after dev4, 10d
    Purchase Orders & Approvals       :done,    dev6, after dev5, 14d
    
    section Phase 4: Inventory & Finance
    Inventory Receiving & Returns     :done,    dev7, after dev6, 14d
    Site Releases                     :done,    dev8, after dev7, 10d
    Finance (Invoices & Disbursements):done,    dev9, after dev8, 14d
    
    section Phase 5: Finalization
    Testing & Security Audits         :active,  test1, 2025-07-01, 14d
    UI/UX Polish & Animations         :active,  test2, after test1, 14d
    Deployment & User Training        :         deploy, after test2, 14d
```
