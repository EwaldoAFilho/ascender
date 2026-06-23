"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Cable,
  Home,
  LayoutDashboard,
  LineChart,
  LogOut,
  Map,
  Menu,
  Moon,
  Network,
  ReceiptText,
  Settings,
  Sun,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/lib/theme";

type Item = { href: string; label: string; icon: LucideIcon; exact?: boolean };

// Atalhos de "acompanhar" — alcançáveis no polegar. Cadastros/Propostas
// (trabalho) ficam fora do mobile de propósito.
const TABS: Item[] = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/executivo", label: "Executivo", icon: LayoutDashboard },
  { href: "/soliscloud", label: "Operação", icon: Zap },
  { href: "/financeiro", label: "Financeiro", icon: ReceiptText },
];

const MAIS: Item[] = [
  { href: "/usinas", label: "Usinas", icon: Sun },
  { href: "/rateio", label: "Rateio", icon: Network },
  { href: "/geracao", label: "Geração", icon: LineChart },
  { href: "/analise", label: "Análise", icon: BarChart3 },
  { href: "/mapa", label: "Mapa", icon: Map },
  { href: "/integracoes", label: "Integrações", icon: Cable },
  { href: "/configuracoes/integracoes", label: "Configurações", icon: Settings },
];

function matches(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);

  // Fecha o menu "Mais" ao navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <>
      {open ? (
        <div
          className="mobile-sheet-overlay"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Mais opções"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sheet-head">
              <strong>Menu</strong>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <nav className="mobile-sheet-list">
              {MAIS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={matches(pathname, item.href) ? "active" : ""}
                  aria-current={matches(pathname, item.href) ? "page" : undefined}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
              <button type="button" onClick={toggleTheme}>
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                {theme === "dark" ? "Tema claro" : "Tema escuro"}
              </button>
              <button type="button" className="danger" onClick={handleLogout}>
                <LogOut size={18} />
                Sair
              </button>
            </nav>
          </div>
        </div>
      ) : null}

      <nav className="mobile-nav" aria-label="Navegação principal">
        {TABS.map((tab) => {
          const active = matches(pathname, tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={open ? "active" : ""}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <Menu size={20} />
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
}
