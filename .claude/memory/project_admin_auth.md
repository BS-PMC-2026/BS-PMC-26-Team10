---
name: project-admin-auth
description: Admin authentication system implemented for /staffLogin — JWT, bcrypt, password reset via email, protected routes
metadata:
  type: project
---

Admin auth system fully implemented on branch BSPMT10-131-usn34.

**Why:** User story required a complete, connected admin auth system (previously /staffLogin was UI-only with no backend).

**How to apply:** The JWT_SECRET env var must be set in .env before running the backend. Frontend token is stored in localStorage under keys `cl_admin_token` / `cl_admin_expiry`. Sessions expire after 10 minutes.

Key files:
- `Backend/db/sql/create_admin_users_table.sql` — run first
- `Backend/db/sql/create_password_reset_tokens_table.sql` — run second
- `Backend/app/routes/admin_auth.py` — endpoints: POST /admin/register, POST /admin/login, GET /admin/me, POST /admin/forgot-password, POST /admin/reset-password
- `Backend/app/services/admin_auth_services.py` — bcrypt hashing, JWT (python-jose), reset tokens
- `Backend/app/services/email_service.py` — added `send_password_reset_email` using SMTP
- `src/context/AuthContext.jsx` — global auth state, auto-logout timer
- `src/components/ProtectedRoute/ProtectedRoute.jsx` — redirects unauthenticated users to /staffLogin
- `src/pages/Auth.jsx` — 4 views: login, register, forgot, reset (URL ?reset=<token>)
- `src/styles/auth.css` — redesigned to match admin sidebar (dark brown gradient + ChilliLand red)
- `src/App.jsx` — wrapped in AuthProvider, /owner routes wrapped in ProtectedRoute

New dependencies added to requirements.txt: `python-jose[cryptography]`, `passlib[bcrypt]`.
Frontend URL for reset links: FRONTEND_URL env var (default: http://localhost:5173).
