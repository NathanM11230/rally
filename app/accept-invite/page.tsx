import { AcceptInviteForm } from "@/components/AcceptInviteForm";

export default function AcceptInvitePage() {
  return (
    <main className="auth-page">
      <section className="panel auth-panel">
        <div className="auth-copy">
          <span className="brand-mark">R</span>
          <h1>Finish your Rally account</h1>
          <p className="page-subtitle">
            Your email has been confirmed. Choose the password you will use to
            log in.
          </p>
        </div>
        <AcceptInviteForm />
      </section>
    </main>
  );
}
