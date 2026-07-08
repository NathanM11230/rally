import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <div className="auth-copy">
          <span className="brand-mark">R</span>
          <h1>Log in to Rally</h1>
        </div>
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
