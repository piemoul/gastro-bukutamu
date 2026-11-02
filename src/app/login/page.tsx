import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session.userId) {
    redirect(session.role === "admin" ? "/admin" : "/dashboard");
  }
  return (
    <main className="workspace-login">
      {/* Background Decorative Glows */}

      <div className="workspace-login-content">
        {/* Logo and Header */}
        <div className="workspace-login-heading">
          <img src="/gastro-logo.webp" alt="GASTRO" />
          <h1>
            Gastro Buku Tamu
          </h1>
          <p>
            Pencatatan pengunjung dan prospek di setiap acara Gastro.
          </p>
        </div>

        {/* Card Form Container */}
        <div className="workspace-login-card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-ink-900">Masuk Akun</h2>
            <p className="text-sm text-ink-500 mt-1">Gunakan email terdaftar dan password acara Anda.</p>
          </div>
          <LoginForm />
        </div>

        {/* Footer info */}
        <p className="workspace-login-footer">
          PT Gastro Gizi Sarana · Commercial Kitchen Equipment
        </p>
      </div>
    </main>
  );
}
