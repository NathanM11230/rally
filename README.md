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
- Manual `sms:` links for reminder texts

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and run the SQL in `supabase/schema.sql`.

   If you already ran an earlier Rally schema, run this updated SQL again. It
   adds `contacts`, `lesson_students`, `lesson_instructors`, `lessons.status`,
   `lessons.session_type`, and `lessons.event_title`, migrates each existing
   lesson's current student and pro into those tables, and keeps the existing
   `lessons` fields as compatibility values.

3. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   LESSON_TIME_ZONE=America/New_York
   ```

   Keep `SUPABASE_SERVICE_ROLE_KEY` private. It is used only from server code.

4. Run the app locally:

   ```bash
   npm run dev
   ```

   On some Windows PowerShell setups, use `npm.cmd run dev`.

5. Open `http://localhost:3000`.

## Club Pros

Rally stores each pro's name and phone number in `instructor_profiles`. In this
club MVP, there is no login system yet; the roster is shared by the club.

Go to **Manage pros** to add pros at your club. When creating or editing a
session, choose one or more pros for that reservation. Rally uses the selected
pros' names and phone numbers when preparing manual reminder texts.

## Calendar

Go to **Calendar** from the dashboard to see sessions in a monthly calendar view.
Use the pro filters to show all sessions or only one pro's individual sessions.
Each calendar item links back to the edit page for that reservation.

## Session Types

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
phone numbers when the session only needs to be tracked for calendar or pay
period reporting.

Each reservation can also have one or more pros assigned. Rally keeps the first
selected pro as the primary compatibility value on `lessons.instructor_profile_id`
and stores the full pro list in `lesson_instructors`.

## Pay Period Reports

Rally tracks lesson work status so pros can compare completed lessons against
what they were paid for. The club pay period is calculated in two-week windows
starting Monday, July 6, 2026.

Go to **Pay Periods** to:

- move between previous, current, and next pay periods
- filter the report by pro
- mark lessons as scheduled, completed, cancelled, or no-show
- print a clean report for the selected pay period

This is only a reporting tool. Rally does not process payments.

## Multi-Student Reservations

Each lesson can have one or many students. The lesson form lets you add multiple
student names and phone numbers to the same reservation.

## Contacts

Rally saves participant contacts automatically. When a pro saves a session with a
name and phone number, Rally stores that contact club-wide. Later, typing the
name in a student or participant field shows matching saved contacts; selecting
one fills the phone number automatically.

Names are used for search because pros usually remember names first. Phone
numbers are normalized behind the scenes to avoid duplicate saved contacts when
the same person is entered again.

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
- open a prefilled SMS to the selected pro
- mark the reminder as sent
- reset the sent status if needed

The app does not send texts in the background. The pro reviews the prefilled
text and taps send in their own messaging app. This avoids Twilio, A2P 10DLC,
toll-free verification, and Vercel Cron complexity for the MVP.

## API Routes

- `GET /api/instructor-profile` lists club pros.
- `POST /api/instructor-profile` adds a club pro.
- `PATCH /api/instructor-profile/:id` edits a club pro.
- `GET /api/contacts?q=name` searches saved contacts by name.
- `GET /api/lessons` lists upcoming lessons.
- `POST /api/lessons` creates a session with the selected pros and participants.
- `PATCH /api/lessons/:id` edits a session, selected pros, and participants.
- `DELETE /api/lessons/:id` deletes a lesson.
- `PATCH /api/lessons/:id/status` updates scheduled/completed/cancelled/no-show status.
- `POST /api/lessons/:id/reminder-sent` marks a manual reminder as sent.
- `DELETE /api/lessons/:id/reminder-sent` resets a reminder to not sent.

## Deploying

Set these Vercel environment variables:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LESSON_TIME_ZONE=America/New_York
```

Redeploy after changing environment variables.
