# Mashgiach Now

## Current Status
Core platform is now stable. Auth, billing, RLS, and business onboarding flow are working correctly.

---

## What Works

### Authentication
- Signup (business & mashgiach)
- Login with role-based redirects
- Session handling (client + server aligned)
- Business route protection via layout

### Business Flow
- Business dashboard loads correctly
- Account summary visible (email, business name, subscription status)
- Business profile auto-created on first login (via layout)
- Business profile editable via `/business/profile`

### Billing
- Stripe checkout + portal secured
- Server-side auth (no client userId trust)
- Subscription status reflects database state
- New accounts correctly start as **inactive**

### Database / RLS
- RLS policies enforced for `business_profiles`
- Insert/update/select restricted to owning user
- Unique constraint on `user_id` enforced
- Column defaults fixed (no auto-active subscription bug)

---

## Recent Fixes (Major)

- Fixed login/session mismatch (switched to SSR browser client)
- Centralized business auth in `app/business/layout.tsx`
- Removed client-side route protection duplication
- Secured Stripe endpoints with server-side identity verification
- Removed invalid billing fields (`unlock_credits`) across app + webhook
- Fixed `business_profiles` defaults causing fake subscriptions
- Refactored signup → no longer creates business profile prematurely
- Added `ensureBusinessProfile()` to create profile post-auth
- Fixed profile save using `upsert` with `onConflict: 'user_id'`
- Added Business Profile page
- Added dashboard account summary
- Added navbar identity indicator

---

## Known Issues / TODO

### Core Bugs
- Applicants page → profile link issues
- Unlock flow edge cases (double unlocks / state sync)
- Some routes still not fully protected

### UX / Product Gaps
- No onboarding redirect to profile completion (currently only banner)
- No validation for required business profile fields
- No subscription enforcement on unlock usage yet
- No clear error handling for billing failures

---

## Next Steps (Priority Order)

### 1. Route Protection (Finish)
- Ensure ALL business/mashgiach routes are protected
- Remove any remaining client-side auth checks

### 2. Unlock System Hardening
- Prevent duplicate unlocks
- Ensure accurate credit decrement
- Enforce subscription limits

### 3. Applicants Flow Fix
- Fix applicants → mashgiach profile linking
- Ensure correct IDs and routing

### 4. Onboarding Improvement
- Redirect to `/business/profile` if profile incomplete
- Optionally require business_name before proceeding

### 5. Middleware (Final Infra Step)
- Add minimal Supabase middleware for SSR session consistency

---

## Architecture Notes

### Auth
- Supabase SSR client used
- Server-side auth enforced via layout
- Roles stored in `users` table

### Business Profiles
- Owned by `user_id`
- Created lazily (post-login)
- Managed via `/business/profile`

### Billing
- Stripe integrated via API routes
- Identity verified server-side using token
- Subscription state stored in `business_profiles`

---

## Dev Workflow
- Code via Codex + manual review
- Always review diffs before applying
- Commit after stable checkpoints

---

## Last Checkpoint
- Business profile system complete
- Dashboard + navbar identity visible
- Billing state corrected
- App stable and usable