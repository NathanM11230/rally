# Rally Manual SMS Lesson Reminders

Rally is a lightweight MVP for tennis clubs to create lesson reservations and
prepare SMS reminder messages for students and pros.

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
   adds `lesson_students`, migrates each existing lesson's current student into
   that table, and keeps the existing `lessons` fields as compatibility values.

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

Go to **Manage pros** to add both pros at your club. When creating or editing a
lesson, choose which pro owns that reservation. Rally uses the selected pro's
name and phone number when preparing manual reminder texts.

## Calendar

Go to **Calendar** from the dashboard to see lessons in a monthly calendar view.
Use the pro filters to show all lessons or only one pro's individual lessons.
Each calendar lesson links back to the edit page for that reservation.

## Multi-Student Reservations

Each lesson can have one or many students. The lesson form lets you add multiple
student names and phone numbers to the same reservation.

The database stores:

- `lessons.instructor_profile_id`
- `lessons.lesson_start_time`
- `lessons.location`
- `lessons.notes`
- `lessons.reminder_sent`
- `lesson_students.student_name`
- `lesson_students.student_phone`

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
- `GET /api/lessons` lists upcoming lessons.
- `POST /api/lessons` creates a lesson with the selected pro and students.
- `PATCH /api/lessons/:id` edits a lesson, selected pro, and students.
- `DELETE /api/lessons/:id` deletes a lesson.
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
