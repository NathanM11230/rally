import { redirect } from "next/navigation";

import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <div className="auth-copy">
          <span className="brand-mark">R</span>
          <h1>Request your Rally login</h1>
          <p className="page-subtitle">
            Use your club invite or approved email. Rally will email you a
            secure link to set your password.
          </p>
        </div>
        <AuthForm mode="signup" />
      </section>
    </main>
  );
}
