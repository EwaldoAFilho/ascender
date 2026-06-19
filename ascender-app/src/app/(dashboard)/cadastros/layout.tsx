"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Cable,
  FileText,
  GitCompareArrows,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";

const tabs: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/cadastros/usinas", label: "Usinas", icon: Sun },
  { href: "/cadastros/clientes", label: "Clientes", icon: Users },
  { href: "/cadastros/unidades", label: "UCs", icon: Building2 },
  { href: "/cadastros/contratos", label: "Contratos", icon: FileText },
  { href: "/cadastros/distribuidoras", label: "Distribuidoras", icon: Cable },
  { href: "/cadastros/conciliacao", label: "Conciliação", icon: GitCompareArrows },
];

export default function CadastrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <>
      <section className="registry-tabs" aria-label="Cadastros">
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
