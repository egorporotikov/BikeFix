from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["auth"])

# NOTE: Authentication endpoints have been deprecated and migrated to Supabase Auth.
# 
# OLD ENDPOINTS (REMOVED):
# - POST /auth/register - Replaced by supabase.auth.signUp() on frontend
# - POST /auth/login - Replaced by supabase.auth.signInWithPassword() on frontend
#
# NEW FLOW:
# 1. Frontend calls supabase.auth.signUp() for registration
# 2. Supabase sends confirmation email to user
# 3. User clicks email link, redirected to /auth/callback
# 4. Frontend calls supabase.auth.signInWithPassword() to login
# 6. All API requests include Supabase JWT token in Authorization header
# 7. Backend verifies token using app.middleware.verify_token.verify_supabase_token()



