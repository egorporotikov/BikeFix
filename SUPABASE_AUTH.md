# Supabase Auth Implementation Guide

## Overview
BikeFix now uses Supabase Auth for secure, production-grade authentication with email verification. The system manages user registration, email confirmation, login, and automatic token injection into API requests.

## Architecture

### Frontend Flow
1. **Registration** → `supabase.auth.signUp()`
   - User provides email, password, username, and role
   - Supabase sends confirmation email
   - User sees "Check your email" message
   
2. **Email Confirmation** → `/auth/callback`
   - User clicks email link from Supabase
   - Redirected to callback page with session established
   - Callback calls `POST /users/create-profile` to create user profile
   - User redirected to appropriate dashboard

3. **Login** → `supabase.auth.signInWithPassword()`
   - User provides email and password
   - Supabase authenticates and returns session
   - User redirected to dashboard based on role

4. **API Requests** → Automatic Token Injection
   - `apiClient` automatically includes Bearer token
   - Token sourced from Supabase session
   - Invalid/expired tokens trigger 401 redirect to login

### Backend Flow
1. **Profile Creation** → `POST /users/create-profile`
   - Accepts { auth_id, username, role }
   - Links Supabase auth user to database profile
   - Returns full user profile

2. **Protected Routes** → Token Verification
   - All protected endpoints verify JWT token
   - Token extracted from `Authorization: Bearer <token>` header
   - Invalid tokens return 401 Unauthorized

## Environment Setup

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

## Key Files

### Frontend
- `frontend/lib/supabase.ts` - Supabase client initialization
- `frontend/context/AuthContext.tsx` - Global auth state management
- `frontend/lib/apiClient.ts` - HTTP client with automatic token injection
- `frontend/app/auth/register/page.tsx` - Registration UI
- `frontend/app/auth/login/page.tsx` - Login UI
- `frontend/app/auth/callback/page.tsx` - Email confirmation handler
- `frontend/app/auth/layout.tsx` - Auth page layout

### Backend
- `backend/app/middleware/verify_token.py` - JWT token verification
- `backend/app/api/routers/users.py` - User profile management
- `backend/app/api/routers/*.py` - All routers now include token verification
- `backend/migrations/0002_add_auth_id_to_users.sql` - Database schema update

## API Endpoints

### Public Endpoints
- None (all endpoints now require authentication)

### User Profile Endpoints
- `POST /users/create-profile` - Create user profile after email confirmation
  - Required: `Authorization: Bearer <token>`
  - Body: `{ auth_id, username, role }`

### Protected Endpoints (All Require Token)
- `POST /repair-requests/create` - Create repair request
- `GET /repair-requests/user/{user_id}` - Get user's repair requests
- `GET /repair-requests/pending` - Get pending repair requests
- `POST /repair-requests/accept/{request_id}` - Accept repair request
- `POST /repair-requests/{request_id}/offers` - Create offer
- `GET /repair-requests/{request_id}/offers` - List offers
- `POST /messages/send` - Send message
- `GET /messages/{request_id}` - List messages
- `POST /upload/upload-photo` - Upload photo

## Database Schema

### public.users
```sql
- id: UUID (primary key)
- auth_id: UUID UNIQUE (links to Supabase auth.users.id)
- email: TEXT (optional, from auth metadata)
- username: TEXT
- role: TEXT ('user' or 'mechanic')
- created_at: TIMESTAMP
- hashed_password: TEXT (deprecated, can be removed)
```

## Testing the Flow

### 1. Register New User
```bash
POST http://localhost:3000/auth/register
Body: {
  "email": "test@example.com",
  "password": "password123",
  "username": "testuser",
  "role": "user"
}
```
Expected: Redirected to Supabase email confirmation

### 2. Confirm Email
- Check email for confirmation link
- Click link (automatically handled by Supabase)

### 3. Access Dashboard
- User automatically logged in
- Redirected to `/user/dashboard` or `/mechanic/dashboard`
- Can now make API requests with automatic token injection

### 4. Make Authenticated API Request
```bash
GET http://localhost:8000/repair-requests/user/some-user-id
Headers: Authorization: Bearer <token>
```

## Migration Notes

### Deprecated Features
- Old `/auth/register` endpoint removed
- Old `/auth/login` endpoint removed
- Removed bcrypt-based password hashing
- localStorage 'auth' key deprecated (kept for backward compatibility)

### Breaking Changes
- All API endpoints now require Bearer token
- Frontend must include Supabase SDK
- Environment variables must be configured

## Troubleshooting

### Issue: "Missing authorization header"
- Solution: Ensure token is being injected by apiClient
- Check: Browser DevTools → Network → Headers
- Verify: `Authorization: Bearer <token>` header present

### Issue: "Token has expired"
- Solution: User needs to login again
- Frontend handles this with 401 redirect
- Session stored in Supabase, not localStorage

### Issue: "Invalid authorization header format"
- Solution: Ensure Bearer token format is correct
- Must be: `Authorization: Bearer <token>` (with space)

### Issue: Email not received
- Solution: Check Supabase email settings in project
- Verify: Email address is correct
- Check: Spam folder

## Security Considerations

1. **Token Storage**: Supabase SDK manages tokens securely
2. **HTTPS**: Always use HTTPS in production
3. **CORS**: Configure allowed origins in backend
4. **JWT Verification**: Backend verifies all tokens
5. **Email Verification**: Required for account activation

## Future Improvements

1. Add password reset flow
2. Implement OAuth providers (Google, GitHub)
3. Add two-factor authentication
4. Implement token refresh logic
5. Add role-based access control (RBAC) to backend
