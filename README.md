# Rally Manual SMS Lesson Reminders

Rally is a lightweight MVP for tennis clubs to create lesson, clinic, and event
reservations and prepare SMS reminder messages for students and pros.

This app is intentionally SMS-only. It does not include email reminders,
payments, Twilio sending, or automated SMS provider delivery. Rally opens a
prefilled text message and the pro sends it manually from their own SMS app.

## Stack

- Next.js App Router
- TypeScript
- Supabase Postgres
- Supabase Auth for pro logins
- Manual `sms:` links for reminder texts

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and run the SQL in `supabase/schema.sql`.

   If you already ran an earlier Rally schema, run this updated SQL again. It
   adds `contacts`, `lesson_students`, `lesson_instructors`, `lessons.status`,
   `lessons.session_type`, `lessons.event_title`, and
   `instructor_profiles.user_id`, migrates each existing lesson's current
   student and pro into those tables, and keeps the existing `lessons` fields
   as compatibility values.

3. In Supabase, enable email/password signups under **Authentication**.

   This is only for pro login. Rally still does not send email reminders. For
   the easiest club MVP, you can turn email confirmations off, or leave them on
   and have each pro confirm their email before logging in.

4. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   SUPABASE_ANON_KEY=
   LESSON_TIME_ZONE=America/New_York
   ```

   Keep `SUPABASE_SERVICE_ROLE_KEY` private. It is used only from server code.
   `SUPABASE_ANON_KEY` is used for Supabase Auth login and signup.

5. Run the app locally:

   ```bash
   npm run dev
   ```

   On some Windows PowerShell setups, use `npm.cmd run dev`.

6. Open `http://localhost:3000`.

## Pro Logins And Profiles

Each pro creates their own Rally login with Supabase Auth. Signup asks for the
pro's full name and phone number, then saves that information in
`instructor_profiles`.

If a matching unclaimed pro profile already exists, Rally connects the new login
to that profile by matching phone number first, then exact full name. Otherwise,
Rally creates a new profile for that user.

The lesson form does not ask for the logged-in pro's phone number every time.
Rally reuses the phone number saved in that pro's profile. A pro can still assign
other saved pros to the same reservation, and any assigned pro can edit the
whole lesson.

Dashboard, calendar, and pay-period reports only show lessons assigned to the
logged-in pro. Contacts remain shared club-wide so everyone can reuse saved
student names and phone numbers.

## Calendar

Go to **Calendar** from the dashboard to see lessons in a monthly calendar view.
The calendar shows only the logged-in pro's assigned lessons. Each calendar
item links back to the edit page for that reservation.

## Lesson Types

Each reservation has one type:

- Lesson
- Clinic
- Other event
- Freshmen
- Varsity
- Team

When **Other event** is selected, Rally asks for the event name, such as
`Cardio Tennis` or `Ladies Night`. That event name appears on the dashboard,
calendar, pay period report, and manual SMS reminders.

Lessons require at least one student name and phone number. Clinics and other
events can include participants, but they can also be saved without participant
phone numbers when the lesson only needs to be tracked for calendar or pay
period reporting.

Each reservation can also have one or more pros assigned. Rally keeps the first
selected pro as the primary compatibility value on `lessons.instructor_profile_id`
and stores the full pro list in `lesson_instructors`.

Each lesson can also include one or more courts. The form lets pros add multiple
court rows, and Rally stores them together in `lessons.location`, such as
`Court 1, Court 2`.

Lesson times are selected in 15-minute intervals. Rally also validates this on
the server before saving.

## Pay Period Reports

Rally groups each pro's assigned lessons into the club pay period so they can
compare what was scheduled against what they were paid for. The club pay period
is calculated in two-week windows starting Monday, July 6, 2026.

Go to **Pay Periods** to:

- move between previous, current, and next pay periods
- review only the logged-in pro's assigned lessons
- see lessons grouped by Varsity, Freshmen, Lessons, and Other events
- print a clean report for the selected pay period

This is only a reporting tool. Rally does not process payments.

## Multi-Student Reservations

Each lesson can have one or many students. The lesson form lets you add multiple
student names and phone numbers to the same reservation.

## Contacts

Rally saves participant contacts automatically. When a pro saves a lesson with a
name and phone number, Rally stores that contact club-wide.

Go to **Contacts** to review the automatic directory. The directory is built
from saved contacts plus existing lesson history, so older lesson entries can
still be reused even if they were created before the contact feature existed.

When creating or editing a lesson, each participant row has a **Saved contact**
dropdown. Selecting a saved contact fills the participant name and phone number
immediately. Typing in the name field also shows matching saved contacts from
the same directory.

Names are used for search because pros usually remember names first. Phone
numbers are normalized behind the scenes to avoid duplicate saved contacts when
the same person is entered again.

## Follow Ups

Go to **Follow ups** to see the people a pro works with most often. Rally ranks
them from the logged-in pro's lesson history and provides a manual text link
with this draft:

```txt
Hey [FirstName], any time to hit soon?
```

The text is not sent automatically. Rally opens the pro's SMS app with the draft
filled in.

The database stores:

- `contacts.full_name`
- `contacts.phone_number`
- `contacts.normalized_name`
- `contacts.normalized_phone`
- `lessons.instructor_profile_id`
- `lessons.session_type`
- `lessons.event_title`
- `lessons.lesson_start_time`
- `lessons.location`
- `lessons.notes`
- `lessons.status`
- `lessons.reminder_sent`
- `lesson_students.student_name`
- `lesson_students.student_phone`
- `lesson_instructors.instructor_profile_id`

The older `lessons.student_name` and `lessons.student_phone` columns are still
filled with the first student as a compatibility fallback.

## Manual SMS Reminders

On the dashboard and edit page, each lesson has actions to:

- open a prefilled SMS to each student
- open a prefilled SMS to other assigned pros
- mark the reminder as sent
- reset the sent status if needed

Rally does not show a pro a text link to their own phone number.

The app does not send texts in the background. The pro reviews the prefilled
text and taps send in their own messaging app. This avoids Twilio, A2P 10DLC,
toll-free verification, and Vercel Cron complexity for the MVP.

Lesson reminder drafts are written like they are coming directly from the pro:

```txt
Hey Nathan. Reminder about your lesson on court 3 at July 7, 4:00 PM.
Let me know if there is anything specific you would like to work on. Thanks!
```

Clinics, team practices, and other events use the same casual format with the
lesson type in the message.

## API Routes

- `POST /api/auth/signup` creates a pro login and profile.
- `POST /api/auth/login` logs a pro in.
- `POST /api/auth/logout` logs a pro out.
- `GET /api/instructor-profile` lists saved pros for assignment.
- `POST /api/instructor-profile` creates or claims the logged-in pro's profile.
- `PATCH /api/instructor-profile/:id` edits the logged-in pro's own profile.
- `GET /api/contacts?q=name` searches shared saved contacts by name.
- `GET /contacts` shows the automatic shared contact directory.
- `GET /api/lessons` lists the logged-in pro's upcoming assigned lessons.
- `POST /api/lessons` creates a lesson with the selected pros and participants.
- `PATCH /api/lessons/:id` edits a lesson, selected pros, and participants.
- `DELETE /api/lessons/:id` deletes a lesson.
- `PATCH /api/lessons/:id/status` updates scheduled/completed/cancelled/no-show status.
- `POST /api/lessons/:id/reminder-sent` marks a manual reminder as sent.
- `DELETE /api/lessons/:id/reminder-sent` resets a reminder to not sent.

Lesson edit, delete, status, and reminder-sent routes require the logged-in pro
to be assigned to that lesson.

## Deploying

Set these Vercel environment variables:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
LESSON_TIME_ZONE=America/New_York
```

Redeploy after changing environment variables.

If Supabase email confirmations are on, set the Supabase Auth site URL to your
Vercel domain so confirmation links point back to Rally.
