
# Hush V2

Browser extension for creating and managing email aliases with a Rust backend API.

## Project Structure

- `src/` - Frontend React application (UI components, landing page)
- `server/` - Rust backend API server

## Frontend (React + Vite)

The frontend is a React application with:
- Landing page design
- Popup and Options page designs
- UI components using Radix UI and Tailwind CSS

### Running the frontend

```bash
npm install
npm run dev
```

## Backend (Rust + Axum + PostgreSQL)

The backend provides a REST API for:
- User authentication (JWT)
- Email alias management
- Email forwarding and logging
- Target email verification

### Running the backend

See `server/README.md` for detailed instructions.

Quick start:
```bash
cd server
cargo run
```

## Documentation

- Frontend: See component files in `src/components/`
- Backend: See `server/README.md` for API documentation
- Project Report: See `PROJECT_REPORT.md` for implementation status

## Original Design

The original design is available at https://www.figma.com/design/x4lnrVQWYtIlk9RyuJrgt2/Browser-Extension-Design-Hush
  