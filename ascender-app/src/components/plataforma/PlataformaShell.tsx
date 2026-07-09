"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

// Shell MÍNIMO do operador da plataforma — distinto do app solar (sem a sidebar de
// usinas/financeiro). O operador administra empresas; para usar o app de uma
// empresa, ele "acessa" (impersona) e cai no shell do app solar.
export function PlataformaShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border, #e5e7eb)",
        }}
      >
        <div>
          <p className="eyebrow">ASCENDER · Operação da plataforma</p>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Plataforma</h1>
        </div>
        <button type="button" className="btn-secondary" onClick={logout}>
          <LogOut size={16} /> Sair
        </button>
      </header>
      <main
        style={{
          flex: 1,
          padding: "1.5rem",
          maxWidth: 1160,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
