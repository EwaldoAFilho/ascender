"use client";

import { usePathname, useRouter } from "next/navigation";
import { PlugZap, ShieldCheck, Users, type LucideIcon } from "lucide-react";

const tabs: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/configuracoes/integracoes", label: "Integrações", icon: PlugZap },
  { href: "/configuracoes/usuarios", label: "Usuários", icon: Users },
  { href: "/configuracoes/senha", label: "Segurança", icon: ShieldCheck },
];

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <section className="registry-tabs" aria-label="Configurações">
        {tabs.map((tab) => (
          <button
            key={tab.href}
            className={pathname === tab.href ? "active" : ""}
            type="button"
            onClick={() => router.push(tab.href)}
          >
            <tab.icon size={17} />
            {tab.label}
          </button>
        ))}
      </section>
      {children}
    </>
  );
}
