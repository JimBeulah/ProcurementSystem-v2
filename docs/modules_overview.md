# Modules Overview

Procurement System v2 is divided into several cohesive modules that track the lifecycle of a construction or organizational project from budgeting to procurement to site delivery.

## 1. Project Management & BOQ
- **Clients**: Management of external client profiles.
- **Projects**: The core entity. Every material request, BOQ, and release is tied to a specific project.
- **Bill of Quantities (BOQ)**: The detailed budget attached to a project. Broken down into elements, items, and resource components (Material, Labor, Equipment).

## 2. Purchasing & Procurement
- **Material Requests (MR)**: Initiated by Site Engineers to request materials needed on site based on the BOQ limits. Requires approval.
- **Purchase Requests (PR)**: Internal formalized request by Procurement to purchase grouped items based on approved MRs.
- **Purchase Orders (PO)**: The finalized external contract with a supplier. Includes multi-stage approval workflows and budget checking against the BOQ.
- **Suppliers**: Database of verified vendors and past performance tracking.

## 3. Inventory & Site Management
- **Receiving (Goods Receipt Note - GRN)**: Logging the physical delivery of items ordered via PO into the centralized inventory/warehouse.
- **Material Returns**: Handling the return process for defective goods received from suppliers.
- **Site Releases**: The process of dispatching inventory from the central warehouse to the actual active project sites. Site engineers confirm receipt of these goods.

## 4. Finance
- **Invoices**: Logging supplier invoices against fulfilled Purchase Orders.
- **Disbursements**: Tracking the actual payment outputs to suppliers.
- **Reports**: High-level financial tracking of budget vs. actuals for Projects.

## 5. System Administration (Settings)
- **Master Data**: Centralized lists of available standalone Materials (with assigned Units), Warehouses, and Suppliers.
- **User Management**: Creating users, resetting passwords, and assigning roles/permissions.
- **Activity Logs**: Auditing system to track all critical actions (Who did what and when) for accountability.
