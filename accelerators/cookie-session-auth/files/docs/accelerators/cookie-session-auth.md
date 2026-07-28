# Cookie session auth

Drop-in single-password auth for internal tools.

## Wiring it up

1. Set `AUTH_PASSWORD` in your environment.
2. Guard server components with `isAuthenticatedRoute()` + `redirect('/login')`.
3. Guard API routes with `requireAuth(request)` and return early if it returns a response.
4. Build a `/login` page that POSTs `{ password }` to `/api/auth/login`.
