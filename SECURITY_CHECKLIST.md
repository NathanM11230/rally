# Rally Security Checklist

Use this before showing Rally to pros or entering real student phone numbers.

## Required Vercel Environment Variables

Set these in Vercel for Production and Preview, then redeploy:

```bash
SIGNUP_INVITE_CODE=
SIGNUP_ALLOWED_EMAILS=
CALENDAR_TOKEN_SECRET=
```

At least one signup gate is required:

- `SIGNUP_INVITE_CODE`: a long random shared invite code for approved pros
- `SIGNUP_ALLOWED_EMAILS`: a comma-separated list of approved pro emails

Use this PowerShell command to generate a strong random value:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Do not use a club name, season, year, or easy phrase as the invite code. Do not
reuse `SUPABASE_SERVICE_ROLE_KEY` for `CALENDAR_TOKEN_SECRET`.

## Required Supabase Auth Setting

In the Supabase Auth settings, disable public new-user signup. Rally creates
approved accounts from its server-only signup route after checking the email
allowlist or invite code. A user created directly through Supabase will not have
Rally's trusted access claim and cannot create a pro profile, but disabling
public signup closes that unnecessary entry point as well.

Rally includes a lightweight in-memory attempt cap for signup and login, but it
is best-effort only on Vercel. Serverless instances do not share memory, and cold
starts reset the counter. The invite code or email allowlist is the real signup
gate, so keep the invite code long and random.

## Live-Site Verification

After redeploying, verify these on the live Vercel URL:

1. Open `/signup`.
2. Try signing up with a fake email and a wrong invite code. It should fail.
3. Sign up only with an approved email or the real invite code.
4. Log in, create a test lesson, and click **Add to calendar** from an iPhone or
   phone browser. The `.ics` file should download/open without showing
   `{"error":"Log in to continue."}`.
5. Visit `/api/contacts` while logged out. It should return `401`.

## Supabase Audit

In Supabase SQL Editor, run:

```sql
select
  id,
  email,
  created_at,
  last_sign_in_at
from auth.users
order by created_at desc;
```

Then run:

```sql
select
  p.id,
  p.user_id,
  u.email,
  p.full_name,
  p.phone_number,
  p.created_at,
  p.updated_at
from public.instructor_profiles p
left join auth.users u on u.id = p.user_id
order by p.created_at desc;
```

Look for any account/profile that is not you or an approved pro. If you find
one, do not assume it is harmless. First rerun the current `supabase/schema.sql`
so the safe foreign keys are installed. You can then remove the unknown Auth
user without deleting lesson history; its profile becomes unlinked. Do not
delete an instructor profile that owns or is assigned to lessons. Reassign its
future lessons first, then soft-disable it with:

```sql
update public.instructor_profiles
set is_active = false
where id = 'PROFILE_ID_HERE';
```

The disabled profile remains on historical lessons and pay records but can no
longer log in or be assigned new lessons.

## Regression Tests

Run these before pushing security-sensitive changes:

```bash
npm test
npm run lint
npm run build
```

The current tests cover:

- signup fails closed when no invite code or allowlist is configured
- Rally access requires a trusted server-side app metadata claim
- invalid and empty invite codes are rejected
- allowlisted emails work case-insensitively
- calendar links require `CALENDAR_TOKEN_SECRET`
- calendar tokens reject expiration, tampering, wrong lesson ids, and malformed tokens
- shared phone numbers remain separate contacts when names differ
- the best-effort login/signup limiter blocks repeated attempts within one server instance
