# Mashgiach Now

## Quick Resume
- Current state:
  - Auth, business routing, and profile setup are working
  - Atomic unlock flow is live and UI CTAs for exhausted unlocks are in place
  - Extra unlock credits are modeled in app/UI, but Stripe purchase flow is not connected yet
- What is working:
  - Login, signup, business dashboard/profile, billing page, unlock gating, and directory/profile unlock UX
- What is broken:
  - Extra unlock credit purchase/checkout is still a placeholder (Stripe not connected yet)
- Immediate next task:
  - Connect Stripe so `$25` purchases add `+5 extra_unlock_credits`, then update the webhook/RPC path to support it cleanly
  - Verify end-to-end flow: Stripe purchase -> webhook -> +5 extra_unlock_credits -> UI updates correctly

## Current Status
- Core platform is stable and usable.
- Auth and role-based routing are working.
- Business onboarding now creates `business_profiles` lazily after authenticated login.
- Unlock system is running through an atomic database RPC.
- Extra unlock credits groundwork is implemented in app state and UI.
- Billing CTAs for exhausted unlocks are implemented across business surfaces.
- Stripe purchase flow for extra unlock packs is still pending.

---

## What Works

### Authentication
- Signup for business and mashgiach users
- Login with role-based redirects
- Client/server session handling aligned
- Business route protection via layout

### Business Flow
- Business dashboard loads correctly
- Account summary visible
- Business profile auto-created on first login
- Business profile editable via `/business/profile`

### Billing
- Stripe checkout and portal secured
- Server-side auth for Stripe routes
- Subscription status reflects database state
- New business accounts start as `inactive`
- Billing page now serves as the central place for subscription and future unlock-pack purchases

### Unlocks
- Unlock creation goes through an atomic RPC
- Duplicate unlock protection is in place
- Subscription gating is enforced server-side
- Remaining unlocks update immediately in the directory flow
- Exhausted-unlock CTAs are shown in directory, profile, dashboard, billing, and unlocked views

### Database / RLS
- `business_profiles` owned by `user_id`
- RLS policies enforced for `business_profiles`
- Insert/update/select restricted to owning user
- Unique constraint on `user_id` enforced

---

## Unlock Credits System (Add-ons)

### Separation of Concepts
- `subscription_status` controls access to unlocking
- `monthly_unlock_limit` represents included plan allowance
- `extra_unlock_credits` represents add-on unlock packs
- `unlocks_used_this_month` represents current-month usage

### Meaning of Each Field
- `subscription_status`
  - Example values: `active`, `inactive`, canceled states from Stripe
  - This is the only access gate for whether a business can unlock profiles
- `monthly_unlock_limit`
  - Included unlocks from the business plan
  - Currently treated as the core plan allowance
  - Should not be mutated when extra packs are bought
- `extra_unlock_credits`
  - Additional unlocks purchased outside the base plan
  - Intended for add-on packs such as `+5`
  - Current app/UI assumes these are for the current month only
- `unlocks_used_this_month`
  - Count of unlocks consumed in the current billing cycle

### Total Unlock Calculation
- Total unlocks available:
  - `monthly_unlock_limit + extra_unlock_credits`
- Remaining unlocks:
  - `(monthly_unlock_limit + extra_unlock_credits) - unlocks_used_this_month`
- Access rule:
  - Even if remaining unlocks are greater than `0`, unlocking is still blocked unless `subscription_status === 'active'`

---

## Unlock Flow

### Server Logic
- Unlock requests go through `app/api/unlocks/create/route.ts`
- That route delegates the real logic to the atomic database RPC:
  - `create_profile_unlock_atomic`
- The atomic RPC is responsible for:
  - validating business ownership
  - preventing self-unlock
  - validating target mashgiach profile
  - enforcing active subscription
  - checking remaining unlocks
  - preventing duplicate unlocks
  - inserting into `profile_unlocks`
  - incrementing `unlocks_used_this_month`

### Access Gate
- `subscription_status` is the gate for whether unlocks are allowed
- Included plan size and extra credits do not bypass inactive subscription state

### Remaining Count
- App and API now expect remaining unlocks to be based on:
  - `(monthly_unlock_limit + extra_unlock_credits) - unlocks_used_this_month`

### Monthly Reset
- The intended model is that `extra_unlock_credits` are current-month only
- The atomic RPC should reset these on monthly cycle rollover together with `unlocks_used_this_month`
- If SQL has not yet been updated, that DB step still needs to be run manually

---

## UI Behavior

### Directory
- Global top banner shows remaining unlocks for active businesses
- Locked profile cards show:
  - `Start Subscription` when inactive
  - `Buy 5 More Unlocks for $25` when active but out of unlocks
  - `Unlock Profile` when active and unlocks remain

### Mashgiach Profile Page
- Business viewers can unlock directly from `/directory/[id]`
- The page loads business subscription state and remaining unlocks
- The locked-state CTA logic mirrors the directory list:
  - inactive => subscribe
  - active + zero remaining => buy more unlocks
  - active + remaining > 0 => unlock

### Dashboard
- Dashboard shows remaining unlocks in summary cards
- When active and at `0` remaining, it shows a global CTA:
  - `You have 0 unlocks remaining this month.`
  - `Buy 5 more unlocks for $25 to continue.`

### Billing
- Billing is the central purchase page for now
- When active and at `0` remaining, billing shows the extra-unlocks offer card
- The button is currently a disabled placeholder
- Helper text explains:
  - `Checkout will be connected next.`

### Unlocked Page
- Shows remaining/used/subscription state
- When active and at `0` remaining, it also shows the buy-more-unlocks CTA

---

## Recent Fixes (Major)
- Fixed login/session mismatch by aligning browser auth with SSR expectations
- Centralized business auth in `app/business/layout.tsx`
- Removed duplicated client-side business auth checks
- Secured Stripe endpoints with server-side identity verification
- Refactored business signup to avoid premature `business_profiles` creation
- Added `ensureBusinessProfile()` to create the row post-auth
- Fixed business profile save with `upsert` on `user_id`
- Added business profile page
- Added dashboard account summary and navbar identity display
- Standardized billing fields as DB-backed values
- Separated subscription access from plan allowance
- Added extra unlock credits groundwork in app/UI
- Added exhausted-unlocks billing CTAs across business surfaces

---

## Current Status Snapshot
- Unlock system complete
- Atomic unlock flow in place
- Extra credits system implemented in app/UI
- Billing CTAs implemented
- Stripe purchase flow for extra packs not built yet

---

## Next Steps

### High Priority
- Connect Stripe checkout for:
  - `$25` => `+5 extra_unlock_credits`
- Add webhook handling to increment `extra_unlock_credits`
- Update billing CTA from placeholder to real checkout action

### Unlock Credits
- Ensure SQL column exists:
  - `extra_unlock_credits integer not null default 0`
- Update atomic RPC to:
  - include `extra_unlock_credits` in total unlock calculation
  - reset `extra_unlock_credits` on monthly cycle rollover

### Product / Plans
- Optional future plan tiers:
  - `20`
  - `50`
  - unlimited
- Decide whether plan size should eventually come from Stripe product/price metadata

### Other Follow-Up
- Applicants page linking / routing cleanup
- Optional onboarding redirect to `/business/profile`
- Validation for required business profile fields
- Minimal Supabase middleware for full SSR consistency

---

## Testing the Unlock System

### Set 0 Remaining
```sql
update public.business_profiles
set
  subscription_status = 'active',
  monthly_unlock_limit = 20,
  extra_unlock_credits = 0,
  unlocks_used_this_month = 20
where user_id = 'YOUR_BUSINESS_USER_ID';
```

Expected UI behavior:
- Directory top banner shows `You have 0 unlocks remaining this month`
- Locked directory cards show:
  - `Buy 5 more unlocks for $25 to continue.`
  - `Buy 5 More Unlocks for $25`
- Profile detail page shows the same exhausted-unlocks CTA
- Dashboard shows the global exhausted-unlocks CTA
- Billing shows the exhausted-unlocks card with disabled placeholder button

### Add 5 Extra Unlock Credits
```sql
update public.business_profiles
set extra_unlock_credits = 5
where user_id = 'YOUR_BUSINESS_USER_ID';
```

Expected UI behavior:
- Remaining unlock count increases by `5`
- Directory top banner reflects the added credits
- Locked profiles with remaining unlocks return to normal `Unlock Profile` behavior
- Dashboard / Billing / Unlocked pages reflect the higher total available unlocks

### Set Inactive Subscription
```sql
update public.business_profiles
set subscription_status = 'inactive'
where user_id = 'YOUR_BUSINESS_USER_ID';
```

Expected UI behavior:
- Unlocking remains blocked even if credits are available
- Directory and profile pages show subscription CTAs instead of unlock or buy-more CTAs
- Billing keeps subscription messaging as the primary action

---

## Architecture Notes

### Auth
- Supabase SSR client used
- Server-side auth enforced via business layout
- Roles stored in `users`

### Business Profiles
- Owned by `user_id`
- Created lazily after authenticated business access
- Managed through `/business/profile`
- Stores:
  - subscription state
  - included unlock allowance
  - extra unlock credits
  - monthly unlock usage

### Billing
- Stripe integrated via API routes
- Identity verified server-side using Supabase token
- Subscription state stored in `business_profiles`
- Extra-unlock purchase flow is planned but not yet connected

---

## Dev Workflow
- Code via Codex plus manual review
- Review diffs before applying
- Commit after stable checkpoints

---

## Last Checkpoint
- Business profile system complete
- Dashboard/navbar identity visible
- Billing state corrected
- Unlock flow moved to atomic RPC
- Extra unlock credits groundwork in place
- CTA system implemented for exhausted unlocks
