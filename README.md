# Projet de Fin d'Etude

This repository contains a full-stack school management platform built with a Laravel API backend and a React frontend.

The application is organized around three main user roles:

- `admin` / `directeur`
- `professeur`
- `stagiaire`

It provides dashboards, authentication, notes management, timetable management, notifications, and student portal features.

## Project Overview

The project is split into two main applications:

- `backend/` - Laravel 13 API, authentication, business logic, database, and file delivery
- `frontend/` - React 19 single-page application for the user interface

The backend exposes role-protected API routes for each dashboard, while the frontend consumes those endpoints and renders the landing page and role-specific dashboards.

## Main Features

- Role-based authentication with Laravel Sanctum
- Separate dashboards for admin, professeur, and stagiaire
- Management of filieres, modules, groupes, stagiaires, and professeurs
- Timetable creation, viewing, and downloading
- Notes workflow, validation, rejection, and batch submission
- Notifications and unread counters
- Profile management for authenticated users
- Stagiaire portal with notes, transcript, timetable, announcements, and AI recommendation endpoint
- Public landing page with role selection and project presentation

## Tech Stack

- Backend: Laravel, PHP 8.3, Sanctum
- Frontend: React 19, React Router, Axios
- UI helpers: Framer Motion, Lucide React, Recharts, Tailwind CSS
- Database: SQLite by default in the current setup

## Repository Structure

```text
backend/
  app/
  bootstrap/
  config/
  database/
  public/
  resources/
  routes/
  storage/

frontend/
  public/
  src/
    components/
    context/
    hooks/
    lib/
    pages/
    services/
```

## Backend Features

The Laravel API includes:

- Authentication endpoints for register, login, and logout
- Shared notification endpoints
- Admin routes for managing academic data and validating notes
- Professeur routes for entering and submitting notes, viewing students, and schedules
- Stagiaire routes for viewing notes, transcript, timetable, and announcements
- Profile update endpoints
- A public route for serving timetable images from storage with CORS support

## Frontend Features

The React app includes:

- Public landing page
- Separate login pages for each role
- Protected dashboard routes
- Layout components for dashboards and public pages
- Dashboard pages for admin, professeur, stagiaire, and directeur
- Reusable UI components, charts, tables, and modals

## Setup

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

If you want to run the Laravel asset pipeline for the backend project:

```bash
npm install
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

## Environment Notes

- Make sure the backend `.env` file is configured correctly before running migrations or login flows.
- The backend uses Sanctum for authenticated API access.
- The project serves uploaded timetable files from `storage/app/public`.
- CORS is configured for local frontend development.

## Useful API Areas

- `/api/login` and `/api/register`
- `/api/notifications`
- `/api/admin/*`
- `/api/professeur/*`
- `/api/stagiaire/*`

## Development Tips

- Keep generated folders like `node_modules/`, `vendor/`, and cache files out of version control.
- Run the backend and frontend separately during development.
- If you change storage-based files, make sure the public storage link and CORS behavior still work as expected.

## License

No license has been specified yet.
