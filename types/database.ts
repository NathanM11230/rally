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
          lesson_start_time: string;
          location: string;
          notes: string | null;
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
          lesson_start_time: string;
          location: string;
          notes?: string | null;
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
          lesson_start_time?: string;
          location?: string;
          notes?: string | null;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
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

export type LessonWithInstructorProfile = Lesson & {
  instructor_profile: InstructorProfile | null;
};
