export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      instructor_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          phone_number: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          phone_number: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          phone_number?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lessons: {
        Row: {
          id: string;
          instructor_profile_id: string;
          student_name: string;
          student_phone: string;
          session_type:
            | "lesson"
            | "clinic"
            | "other_event"
            | "freshmen"
            | "varsity"
            | "team";
          event_title: string | null;
          lesson_start_time: string;
          location: string;
          notes: string | null;
          status: "scheduled" | "completed" | "cancelled" | "no_show";
          reminder_sent: boolean;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          instructor_profile_id: string;
          student_name: string;
          student_phone: string;
          session_type?:
            | "lesson"
            | "clinic"
            | "other_event"
            | "freshmen"
            | "varsity"
            | "team";
          event_title?: string | null;
          lesson_start_time: string;
          location: string;
          notes?: string | null;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          reminder_sent?: boolean;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          instructor_profile_id?: string;
          student_name?: string;
          student_phone?: string;
          session_type?:
            | "lesson"
            | "clinic"
            | "other_event"
            | "freshmen"
            | "varsity"
            | "team";
          event_title?: string | null;
          lesson_start_time?: string;
          location?: string;
          notes?: string | null;
          status?: "scheduled" | "completed" | "cancelled" | "no_show";
          reminder_sent?: boolean;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lessons_instructor_profile_id_fkey";
            columns: ["instructor_profile_id"];
            isOneToOne: false;
            referencedRelation: "instructor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_students: {
        Row: {
          id: string;
          lesson_id: string;
          student_name: string;
          student_phone: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          student_name: string;
          student_phone: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          student_name?: string;
          student_phone?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_students_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
        ];
      };
      lesson_instructors: {
        Row: {
          id: string;
          lesson_id: string;
          instructor_profile_id: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          instructor_profile_id: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          lesson_id?: string;
          instructor_profile_id?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lesson_instructors_lesson_id_fkey";
            columns: ["lesson_id"];
            isOneToOne: false;
            referencedRelation: "lessons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lesson_instructors_instructor_profile_id_fkey";
            columns: ["instructor_profile_id"];
            isOneToOne: false;
            referencedRelation: "instructor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lesson_status: "scheduled" | "completed" | "cancelled" | "no_show";
      session_type:
        | "lesson"
        | "clinic"
        | "other_event"
        | "freshmen"
        | "varsity"
        | "team";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type InstructorProfile =
  Database["public"]["Tables"]["instructor_profiles"]["Row"];
export type InstructorProfileInsert =
  Database["public"]["Tables"]["instructor_profiles"]["Insert"];
export type InstructorProfileUpdate =
  Database["public"]["Tables"]["instructor_profiles"]["Update"];
export type Lesson = Database["public"]["Tables"]["lessons"]["Row"];
export type LessonInsert = Database["public"]["Tables"]["lessons"]["Insert"];
export type LessonUpdate = Database["public"]["Tables"]["lessons"]["Update"];
export type LessonStatus = Database["public"]["Enums"]["lesson_status"];
export type SessionType = Database["public"]["Enums"]["session_type"];
export type LessonStudent =
  Database["public"]["Tables"]["lesson_students"]["Row"];
export type LessonStudentInsert =
  Database["public"]["Tables"]["lesson_students"]["Insert"];
export type LessonStudentUpdate =
  Database["public"]["Tables"]["lesson_students"]["Update"];
export type LessonInstructor =
  Database["public"]["Tables"]["lesson_instructors"]["Row"];
export type LessonInstructorInsert =
  Database["public"]["Tables"]["lesson_instructors"]["Insert"];
export type LessonInstructorUpdate =
  Database["public"]["Tables"]["lesson_instructors"]["Update"];

export type LessonInstructorWithProfile = LessonInstructor & {
  instructor_profile: InstructorProfile | null;
};

export type LessonWithInstructorProfile = Lesson & {
  instructor_profile: InstructorProfile | null;
  lesson_students: LessonStudent[];
  lesson_instructors: LessonInstructorWithProfile[];
};
