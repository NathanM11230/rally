# Rally SMS Lesson Reminders

Rally is a lightweight MVP for tennis instructors to create lessons and send SMS
reminders to both the student and instructor about 24 hours before lesson time.

This app is intentionally SMS-only. It does not include email lesson reminders or
payment features.

## Stack

- Next.js App Router
- TypeScript
- Supabase Postgres
- Twilio SMS
- Vercel Cron or a scheduled request to `/api/cron/send-reminders`

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project and run the SQL in `supabase/schema.sql`.

   If you already ran the first MVP schema, run this updated SQL again. It adds
   `instructor_profiles`, migrates existing lesson instructor name/phone values
   into profiles, converts lesson date/time into `lesson_start_time`, and replaces
   the old reminder status field with `reminder_sent`.

3. Copy `.env.example` to `.env.local` and fill in:

   ```bash
   SUPABASE_URL=
   SUPABASE_SERVICE_ROLE_KEY=
   TWILIO_ACCOUNT_SID=
   TWILIO_AUTH_TOKEN=
   TWILIO_FROM_PHONE=
   CRON_SECRET=
   LESSON_TIME_ZONE=America/New_York
   REMINDER_WINDOW_MINUTES=720
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

Each lesson stores `instructor_profile_id`, so reminders can look up the saved
instructor profile automatically.

## SMS Reminders

Lessons store:

- `student_name`
- `student_phone`
- `lesson_start_time`
- `location`
- `notes`
- `reminder_sent`
- `instructor_profile_id`

The reminder cron checks for lessons about 24 hours away where
`reminder_sent = false`. For each due lesson, Rally joins the connected
instructor profile, sends one SMS to the student, sends one SMS to the
instructor's saved `phone_number`, then marks `reminder_sent = true` only after
Twilio successfully sends both messages.

## API Routes

- `GET /api/instructor-profile` gets the current instructor profile.
- `POST /api/instructor-profile` creates or updates the current instructor profile.
- `GET /api/lessons` lists upcoming lessons.
- `POST /api/lessons` creates a lesson using the saved instructor profile.
- `PATCH /api/lessons/:id` edits a lesson.
- `DELETE /api/lessons/:id` deletes a lesson.
- `GET /api/cron/send-reminders` checks for lessons happening about 24 hours from now, sends SMS reminders, and marks reminders as sent.

For a deployed cron route, set `CRON_SECRET` and call the route with:

```text
Authorization: Bearer your-secret
```

Vercel Cron is configured in `vercel.json` to run once daily at 9:00 AM UTC so
the app can deploy on Vercel Hobby. The default reminder window is 720 minutes
to catch most next-day lessons during that daily run.

For more precise reminders near the 24-hour mark, upgrade to Vercel Pro for
hourly cron jobs or use an external scheduler to call
`/api/cron/send-reminders` hourly.
