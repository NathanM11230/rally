# Rally Manual SMS Lesson Reminders

Rally is a lightweight MVP for tennis instructors to create lessons and prepare
SMS reminder messages for students and instructors.

This app is intentionally SMS-only. It does not include email reminders,
payments, Twilio sending, or automated SMS provider delivery. Rally opens a
prefilled text message and the instructor sends it manually from their own SMS
app.

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

   If you already ran the previous Rally schema, you do not need a new schema
   just for the manual SMS change. The existing `reminder_sent` field is reused
   to track whether the instructor marked a manual reminder as sent.

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

## Instructor Profiles

Rally stores the instructor's name and phone number once in
`instructor_profiles`. In this no-auth MVP, the app uses the first saved profile
as the current instructor profile. The `user_id` column is included so the table
can connect to Supabase Auth users later.

When there is no instructor profile, the dashboard and new lesson page ask the
instructor to complete the profile first. After the profile is saved, lesson
forms no longer ask for instructor name or instructor phone number.

Each lesson stores `instructor_profile_id`, so Rally can include the instructor
name and phone number in manual reminder actions.

## Manual SMS Reminders

Lessons store:

- `student_name`
- `student_phone`
- `lesson_start_time`
- `location`
- `notes`
- `reminder_sent`
- `instructor_profile_id`

On the dashboard and edit page, each lesson has actions to:

- open a prefilled SMS to the student
- open a prefilled SMS to the instructor
- mark the reminder as sent
- reset the sent status if needed

The app does not send texts in the background. The instructor reviews the
prefilled text and taps send in their own messaging app. This avoids Twilio,
A2P 10DLC, toll-free verification, and Vercel Cron complexity for the MVP.

## API Routes

- `GET /api/instructor-profile` gets the current instructor profile.
- `POST /api/instructor-profile` creates or updates the current instructor profile.
- `GET /api/lessons` lists upcoming lessons.
- `POST /api/lessons` creates a lesson using the saved instructor profile.
- `PATCH /api/lessons/:id` edits a lesson.
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
