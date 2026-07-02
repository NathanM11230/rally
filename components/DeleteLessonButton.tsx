"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DeleteLessonButtonProps = {
  lessonId: string;
};

export function DeleteLessonButton({ lessonId }: DeleteLessonButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm("Delete this lesson?");

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    const response = await fetch(`/api/lessons/${lessonId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    setIsDeleting(false);
    window.alert("Unable to delete lesson.");
  }

  return (
    <button className="button-danger" type="button" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
