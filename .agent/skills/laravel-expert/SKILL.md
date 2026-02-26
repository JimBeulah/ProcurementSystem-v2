---
name: laravel-expert
description: Senior Laravel Architect and Security Expert guidelines. Clean architecture, dependency injection, service classes, DTOs, and comprehensive security directives.
allowed-tools: Read, Write, Edit, Glob, Grep
---

# Laravel Expert

> Senior Laravel Architect and Security Expert guidelines for 2025.
> **Strict adherence to Clean Architecture and Enterprise-Grade Security.**

---

## ⚠️ Core Directive

Whenever you generate, review, refactor, or explain Laravel code, you must **strictly adhere** to the following Clean Architecture and Security standards. Do not provide "quick and dirty" solutions unless explicitly asked; default to enterprise-grade patterns.

---

## 1. Architectural Rules (Clean Code & Laravel Features)

### Implicit Route Model Binding
- **Never** manually fetch Eloquent models by ID in a controller if the ID is passed in the route (e.g., avoid `User::findOrFail($id)`).
- **Always** use Route Model Binding in the controller method signature to automatically resolve models and handle 404s.

### Dependency Injection & Service Binding
- **Never** instantiate service classes or actions manually using the `new` keyword inside controllers.
- **Always** inject dependencies via the constructor or method signature so the Laravel Service Container resolves them.
- When applicable, bind interfaces to concrete implementations in Service Providers to maintain loose coupling.

### Skinny Controllers
- Controllers must **only** handle HTTP request extraction and HTTP response formatting.
- **Never** place business logic inside a controller.

### Service & Action Classes
- Route all business logic through dedicated **Service classes** or single-responsibility **Action classes**.

### Data Transfer Objects (DTOs)
- When passing complex data between controllers and services, use **typed DTOs** or value objects instead of generic arrays.

### Validation
- **Never** use inline `$request->validate()`.
- **Always** generate and enforce the use of dedicated **Form Request** classes.

---

## 2. Security Directives

### Mass Assignment
- **Always** define `$fillable` arrays on Eloquent models.
- **Never** use `$guarded = []`.

### Database Interactions
- Default to **Eloquent ORM** or the **Query Builder**.
- If `DB::raw()` is absolutely necessary, you must use proper PDO parameter binding.

### File Uploads
- **Always** validate MIME types and extensions.
- Rename uploaded files using UUIDs (`Str::uuid()`) and store them in non-public directories by default.

---

## 3. Code Quality Standards

### Strict Typing
- **Always** use strict type hints for method arguments and return types.

### Modern PHP
- Utilize modern PHP features (e.g., constructor property promotion, match expressions, nullsafe operators) where appropriate.

### Explanation Mandate
- When correcting code, **briefly explain** why the change improves security or architecture so the developer can learn from the adjustment.
