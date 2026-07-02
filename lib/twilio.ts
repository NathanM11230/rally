import twilio from "twilio";

import { formatLessonTime } from "@/lib/date";
import type { LessonWithInstructorProfile } from "@/types/database";

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  fromPhone: string;
};

type LessonReminderContext = LessonWithInstructorProfile & {
  instructor_profile: NonNullable<LessonWithInstructorProfile["instructor_profile"]>;
};

export async function sendLessonReminderMessages(
  lesson: LessonReminderContext,
  timeZone: string,
) {
  const config = getTwilioConfig();
  const client = twilio(config.accountSid, config.authToken);

  const studentMessage = buildStudentMessage(lesson, timeZone);
  const instructorMessage = buildInstructorMessage(lesson, timeZone);

  const [studentResult, instructorResult] = await Promise.all([
    client.messages.create({
      from: config.fromPhone,
      to: lesson.student_phone,
      body: studentMessage,
    }),
    client.messages.create({
      from: config.fromPhone,
      to: lesson.instructor_profile.phone_number,
      body: instructorMessage,
    }),
  ]);

  return {
    studentMessageSid: studentResult.sid,
    instructorMessageSid: instructorResult.sid,
  };
}

function getTwilioConfig(): TwilioConfig {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_FROM_PHONE;

  if (!accountSid || !authToken || !fromPhone) {
    throw new Error(
      "Missing Twilio configuration. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_PHONE.",
    );
  }

  return {
    accountSid,
    authToken,
    fromPhone,
  };
}

function buildStudentMessage(lesson: LessonReminderContext, timeZone: string) {
  return `Reminder: You have a tennis lesson with ${
    lesson.instructor_profile.full_name
  } tomorrow at ${formatLessonTime(lesson, timeZone)} at ${lesson.location}.`;
}

function buildInstructorMessage(lesson: LessonReminderContext, timeZone: string) {
  return `Reminder: You have a tennis lesson with ${
    lesson.student_name
  } tomorrow at ${formatLessonTime(lesson, timeZone)} at ${lesson.location}.`;
}
