# Rally

Rally is a mobile-first lesson tracker for racquet-sports professionals. It
keeps each pro's schedule, participant contacts, reminder texts, calendar
handoffs, and pay-period records in one place.

[Open Rally](https://rally.management) |
[Pro guide](./PRO_GUIDE.md) |
[Security checklist](./SECURITY_CHECKLIST.md)

The live deployment is private. A club invite or approved email address is
required to create an account. All names and phone numbers shown below are
sample data.

## Why Rally exists

Most lesson management at a small club happens across a calendar, a contact
list, text messages, and a separate payroll record. Rally brings those pieces
together without trying to become a full club-management platform.

A pro can create a lesson in a few taps, reuse a saved participant, open a
ready-to-send reminder in the phone's messaging app, add the lesson to a
personal calendar, and later check the club's two-week pay period for anything
that may have been missed.

Participant entry gets faster over time: the first lesson saves the new
participant automatically, and future lessons can retrieve the full name and
phone number by typing only a few letters of the name.

Rally deliberately does **not** send messages in the background. Reminder links
open the pro's own SMS app with the recipient and message filled in. The pro
reviews the text and taps Send.

## Product tour

<table>
  <tr>
    <td width="50%" align="center">
      <img src="./docs/images/rally-dashboard.png" alt="Rally dashboard showing upcoming lessons and reminder actions" width="280">
    </td>
    <td width="50%" align="center">
      <img src="./docs/images/rally-reminder-text.png" alt="A Rally lesson reminder opened in the iPhone Messages app" width="280">
    </td>
  </tr>
  <tr>
    <td valign="top">
      <strong>Run the day from the dashboard</strong><br>
      Each pro sees only lessons assigned to them, with the participant, time,
      court, reminder status, calendar link, and editing controls together.
    </td>
    <td valign="top">
      <strong>Send reminders from the pro's phone</strong><br>
      Tapping the participant's Text button opens a natural reminder with the
      date, time, and court already filled in. The pro reviews it and taps Send.
    </td>
  </tr>
</table>

<table>
  <tr>
    <td width="50%" align="center">
      <img src="./docs/images/rally-new-lesson.png" alt="Creating a new lesson in Rally" width="280">
    </td>
    <td width="50%" align="center">
      <img src="./docs/images/rally-contact-autofill.png" alt="Searching saved contacts while creating a lesson" width="280">
    </td>
  </tr>
  <tr>
    <td valign="top">
      <strong>Save contacts while scheduling</strong><br>
      Choose a lesson type, assign one or more pros, add participants, pick a
      time, and select one or more courts. Saving a new participant also saves
      that name and phone number to the club contact directory.
    </td>
    <td valign="top">
      <strong>Find them next time by name</strong><br>
      Typing only part of a participant's name filters the shared directory.
      Selecting a result fills both the full name and saved phone number.
    </td>
  </tr>
</table>

### Contacts without double entry

Contact saving is part of lesson creation, not a separate administrative step.
When a pro saves a lesson with a new participant, Rally automatically creates
or updates that shared contact. The next time any pro starts typing the person's
name, Rally shows matching contacts beneath the field; one tap fills the full
name and phone number.

This is intentionally name-first because pros usually remember who they taught,
not the person's phone number. Phone numbers are normalized behind the scenes
so formatting differences do not create unnecessary duplicates. Contacts can
also be added directly from the Contacts page when no lesson is being created.

<table>
  <tr>
    <td width="50%" align="center">
      <img src="./docs/images/rally-follow-ups.png" alt="Rally follow-up suggestions based on lesson history" width="280">
    </td>
    <td width="50%" align="center">
      <img src="./docs/images/rally-follow-up-text.png" alt="A Rally scheduling follow-up opened in the iPhone Messages app" width="280">
    </td>
  </tr>
  <tr>
    <td valign="top">
      <strong>See who may be ready for another lesson</strong><br>
      Follow ups ranks the people a pro teaches most often and shows their
      lesson count and most recent lesson.
    </td>
    <td valign="top">
      <strong>Start the next conversation</strong><br>
      Tapping Text opens a short, editable scheduling message: "Hey Benjamin,
      any time to hit soon?"
    </td>
  </tr>
</table>

### Follow up from lesson history

Rally uses the logged-in pro's lesson history to surface the people they teach
most often. Tapping Text opens the prepared scheduling message in the phone's
messaging app. Nothing is sent automatically: the pro can edit the wording,
choose when to reach out, and tap Send personally.

<p align="center">
  <img src="./docs/images/rally-apple-calendar.png" alt="A Rally lesson imported into Apple Calendar" width="320">
</p>

### Use a personal calendar

A signed, expiring calendar link creates a standard `.ics` event for Apple
Calendar, Google Calendar, Outlook, and other clients. Rally also has its own
Calendar tab for pros who prefer to view their assigned lessons inside the
site. Both calendar options show only lessons assigned to the logged-in pro,
including reservations shared with multiple pros.

<table>
  <tr>
    <td width="50%" align="center">
      <img src="./docs/images/rally-pay-period.png" alt="Rally two-week pay-period report" width="280">
    </td>
    <td width="50%" valign="middle">
      <h3>Cross-check the pay period</h3>
      <p>
        Rally groups each pro's assigned work into the club's two-week pay
        periods. The report includes totals and a breakdown for lessons,
        clinics, other events, Freshmen, Varsity, and Team reservations.
      </p>
      <p>
        It is a reconciliation tool, not a payroll or payment system. Pros can
        compare the report with their pay statement and flag anything that was
        missed.
      </p>
    </td>
  </tr>
</table>

## How the club workflow works

1. A pro signs up with the club invite code and saves a name and phone number
   to their profile.
2. The pro creates a Lesson, Clinic, Other event, Freshmen, Varsity, or Team
   reservation.
3. One or more pros and participants can be assigned to the same reservation.
4. Saving the lesson automatically creates or updates each participant in the
   shared club contact directory.
5. Assigned pros see the reservation on their own dashboard and calendar.
6. A reminder button opens a prepared SMS on the pro's phone. Rally can then
   mark the reminder as sent to prevent accidental duplicates.
7. The reservation appears in each assigned pro's pay-period report and can be
   added to a personal calendar.

Lesson times are offered in 15-minute intervals from 6:00 AM through 9:00 PM.
The court picker includes Tennis Courts 1-8, Pickleball Courts 1-4, and Paddle
Courts 1-5.

## Access model

- Each pro has a Supabase Auth login and an `instructor_profiles` record.
- Dashboard, calendar, lesson history, follow ups, and pay-period reports are
  scoped to the logged-in pro's assigned lessons.
- Any pro assigned to a lesson can edit the entire reservation.
- A pro can create a reservation and assign another pro.
- The participant contact directory is shared across the club.
- Signup is closed unless the server has an invite code or email allowlist
  configured.

## Technical overview

| Area | Implementation |
| --- | --- |
| Web app | Next.js App Router, React, TypeScript |
| Authentication | Supabase Auth with server-managed HTTP-only cookies |
| Database | Supabase Postgres |
| Data access | Next.js route handlers using the server-only Supabase service role |
| Messaging | Manual `sms:` links opened in the pro's native messaging app |
| Calendar | Signed, expiring `.ics` downloads |
| Hosting | Vercel |
| Tests | Node test runner with TypeScript fixtures |

Supabase Row Level Security is enabled with no anonymous policies. Browser
requests go through Rally's authenticated server routes; the service-role key
is never sent to the client.

Calendar downloads use a dedicated HMAC secret, expire after 14 days, and are
bound to the pro who generated the link. Signup and login also have a
best-effort in-memory attempt cap. On Vercel that cap is per serverless instance,
so the long random invite code or email allowlist remains the primary signup
control.

## Local setup

### 1. Install the app

```bash
git clone https://github.com/NathanM11230/rally.git
cd rally
npm install
```

### 2. Create the Supabase database

Create a Supabase project, open its SQL Editor, and run:

```text
supabase/schema.sql
```

The schema is written to be rerunnable for an existing Rally database. If an
older deployment only needs the contact directory repair, run
[`supabase/contacts-table.sql`](./supabase/contacts-table.sql).

### 3. Configure Supabase Auth

Enable email/password authentication. Email is used only for account access;
Rally does not send email lesson reminders.

If email confirmation is enabled, set the Supabase Auth Site URL to the
production Rally URL and add both the production URL and
`http://localhost:3000` as allowed redirect URLs.

### 4. Add environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only database access |
| `SUPABASE_ANON_KEY` | Supabase Auth login and signup |
| `LESSON_TIME_ZONE` | Club timezone, such as `America/New_York` |
| `SIGNUP_INVITE_CODE` | Long random code shared with approved pros |
| `SIGNUP_ALLOWED_EMAILS` | Optional comma-separated signup allowlist |
| `CALENDAR_TOKEN_SECRET` | Independent random secret for calendar links |

At least one signup gate, `SIGNUP_INVITE_CODE` or `SIGNUP_ALLOWED_EMAILS`, must
be set. Do not reuse the Supabase service-role key as the calendar secret.

### 5. Start Rally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On Windows PowerShell,
`npm.cmd run dev` can be used if `npm` script execution is restricted.

## Verification

Run the focused security tests, lint, and production build before deployment:

```bash
npm test
npm run lint
npm run build
```

The current tests cover signup gating, calendar-token validation, and the auth
attempt limiter.

## Deploying to Vercel

1. Import `NathanM11230/rally` into Vercel and use `main` as the production
   branch.
2. Add the same environment variables listed above to the Production
   environment.
3. Deploy, then update the Supabase Auth Site URL and redirect allowlist with
   the final Vercel or custom domain.
4. Test signup, login, contact creation, lesson creation, a reminder handoff,
   and an Add to calendar link on a real phone.
5. Complete [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) before inviting
   additional pros.

Environment-variable changes require a new Vercel deployment before they take
effect.

## Scope

Rally is intentionally small. It includes scheduling, shared contacts, manual
SMS reminders, calendar handoff, follow ups, and pay-period reconciliation.
It does not include automated SMS delivery, email reminders, billing, payments,
court availability management, or a public registration flow.

For day-to-day instructions, see [`PRO_GUIDE.md`](./PRO_GUIDE.md).
