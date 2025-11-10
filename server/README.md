# Hush V2 Server

Rust backend server for Hush V2 browser extension - email alias management API.

## Features

- JWT-based authentication (access + refresh tokens)
- Email alias management (create, list, toggle, delete)
- Email forwarding and logging
- Target email verification flow
- PostgreSQL database with SQLx migrations
- RESTful API endpoints

## Prerequisites

- Rust 1.70+ (with Cargo)
- PostgreSQL 12+
- SMTP server credentials (for email verification)

## Setup

1. **Install dependencies:**
   ```bash
   cargo build
   ```

2. **Set up PostgreSQL database:**
   ```bash
   createdb hush
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run migrations:**
   Migrations run automatically on server startup via SQLx.

5. **Start the server:**
   ```bash
   cargo run
   ```

The server will start on `http://localhost:3001` (or the port specified in `PORT`).

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `POST /api/v1/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  Returns:
  ```json
  {
    "access_token": "...",
    "refresh_token": "...",
    "expires_in": 3600
  }
  ```

- `POST /api/v1/auth/refresh` - Refresh access token
  ```json
  {
    "refresh_token": "..."
  }
  ```

- `POST /api/v1/auth/logout` - Logout (requires auth)

### Aliases

All alias endpoints require authentication (Bearer token in Authorization header).

- `GET /api/v1/aliases` - List user's aliases
- `POST /api/v1/aliases` - Create new alias
  ```json
  {
    "alias_type": "random" | "custom" | "temporary",
    "custom": "optional-custom-part",
    "ttl_minutes": 60
  }
  ```

- `DELETE /api/v1/aliases/:id` - Delete alias
- `POST /api/v1/aliases/:id/toggle` - Toggle alias (enable/disable)
  ```json
  {
    "enabled": true
  }
  ```

- `GET /api/v1/aliases/:id/logs?limit=20` - Get email logs for alias

### Target Email

- `GET /api/v1/targets` - Get current target email (requires auth)
- `POST /api/v1/targets/request_verify` - Request verification email (requires auth)
  ```json
  {
    "target": "user@example.com"
  }
  ```

- `POST /api/v1/targets/verify?token=...` - Verify email with token (public)

### Notifications

- `POST /api/v1/notifications/subscribe` - Subscribe to push notifications (requires auth)

## Database Schema

The database includes the following tables:

- `users` - User accounts
- `aliases` - Email aliases
- `target_emails` - Verified forwarding addresses
- `email_logs` - Email forwarding logs

See `migrations/001_initial_schema.sql` for full schema.

## Development

### Running tests

```bash
cargo test
```

### Database migrations

Migrations are in `migrations/` directory and run automatically on startup.

To create a new migration:
```bash
sqlx migrate add migration_name
```

### Environment Variables

See `.env.example` for all available configuration options.

## Security Notes

- Change `JWT_SECRET` in production to a strong random string
- Use HTTPS in production
- Configure CORS appropriately for your extension origin
- Rate limiting should be added for production use
- Consider adding email validation and CAPTCHA for registration

## License

See main project LICENSE file.

