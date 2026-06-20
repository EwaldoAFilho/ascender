"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  Cable,
  FileText,
  GitCompareArrows,
  LayoutGrid,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DesktopOnly } from "@/components/DesktopOnly";

const tabs: Array<{ href: string; label: string; icon: LucideIcon; exact?: boolean }> = [
  { href: "/cadastros", label: "Visão geral", icon: LayoutGrid, exact: true },
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

  return (
    <DesktopOnly area="Os cadastros">
      <nav className="registry-tabs" aria-label="Tipos de cadastro">
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              <tab.icon size={17} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </DesktopOnly>
  );
}
