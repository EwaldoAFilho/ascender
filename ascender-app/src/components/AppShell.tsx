"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LineChart,
  LogOut,
  Map,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";
import { modules, viewSubtitles, viewTitles } from "@/lib/dashboard-data";
import { sairDaEmpresaAction } from "@/lib/auth/platform-actions";
import { useTheme } from "@/lib/theme";
import { MobileNav } from "@/components/MobileNav";

function moduleMatches(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolveHeader(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/") {
    return { title: viewTitles.overview, subtitle: viewSubtitles.overview };
  }
  const mod = modules.find((module) => moduleMatches(module.href, pathname));
  if (mod) {
    return { title: viewTitles[mod.id], subtitle: viewSubtitles[mod.id] };
  }
  if (pathname.startsWith("/configuracoes")) {
    return {
      title: "Configurações",
      subtitle: "Integrações de API e segurança da conta.",
    };
  }
  if (pathname.startsWith("/geracao")) {
    return {
      title: "Histórico de geração",
      subtitle: "Curva e produção das usinas, direto da SolisCloud.",
    };
  }
  if (pathname.startsWith("/mapa")) {
    return {
      title: "Mapa das usinas",
      subtitle: "Posição geográfica das usinas pelas coordenadas cadastradas.",
    };
  }
  if (pathname.startsWith("/analise")) {
    return {
      title: "Análise de geração",
      subtitle: "Gráficos interativos com filtro por usina e período.",
    };
  }
  return { title: "ASCENDER", subtitle: "" };
}

export function AppShell({
  children,
  impersonando = false,
  empresaNome,
}: {
  children: React.ReactNode;
  impersonando?: boolean;
  empresaNome?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDarkTheme = theme === "dark";
  const [saindo, startSair] = useTransition();
  const header = resolveHeader(pathname);
  const activeModule = modules.find((module) =>
    moduleMatches(module.href, pathname),
  );

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  function sairDaEmpresa() {
    startSair(async () => {
      await sairDaEmpresaAction();
      // Nav completo: garante que a sessão sem empresa seja relida.
      window.location.assign("/plataforma");
    });
  }

  return (
    <div className="app-shell">
      {impersonando ? (
        <div
          role="status"
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
            padding: "0.5rem 1rem",
            background: "#b45309",
            color: "#fff",
            fontSize: "0.9rem",
          }}
        >
          <span>
            Você está acessando a empresa <strong>{empresaNome ?? "—"}</strong>{" "}
            como operador da plataforma.
          </span>
          <button
            type="button"
            onClick={sairDaEmpresa}
            disabled={saindo}
            style={{
              background: "#fff",
              color: "#b45309",
              border: "none",
              borderRadius: 6,
              padding: "0.3rem 0.75rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {saindo ? "Saindo…" : "Sair da empresa"}
          </button>
        </div>
      ) : null}

      <aside className="sidebar">
        <button
          className="brand-lockup"
          type="button"
          onClick={() => router.push("/")}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-black.jpeg" alt="ASCENDER" />
        </button>
        <nav>
          <button
            className={pathname === "/" ? "active" : ""}
            type="button"
            onClick={() => router.push("/")}
          >
            <LayoutDashboard size={18} /> Inicio
          </button>
          {modules.map((module) => (
            <button
              key={module.id}
              className={moduleMatches(module.href, pathname) ? "active" : ""}
              type="button"
              onClick={() => router.push(module.href)}
            >
              <module.icon size={18} /> {module.title}
            </button>
          ))}
          <button
            className={pathname.startsWith("/geracao") ? "active" : ""}
            type="button"
            onClick={() => router.push("/geracao")}
          >
            <LineChart size={18} /> Geracao
          </button>
          <button
            className={pathname.startsWith("/analise") ? "active" : ""}
            type="button"
            onClick={() => router.push("/analise")}
          >
            <BarChart3 size={18} /> Analise
          </button>
          <button
            className={pathname.startsWith("/mapa") ? "active" : ""}
            type="button"
            onClick={() => router.push("/mapa")}
          >
            <Map size={18} /> Mapa
          </button>
          <button
            className={pathname.startsWith("/configuracoes") ? "active" : ""}
            type="button"
            onClick={() => router.push("/configuracoes/integracoes")}
          >
            <Settings size={18} /> Configuracoes
          </button>
        </nav>
      </aside>

      <main>
        <div className="mobile-topbar">
          <div>
            <p className="eyebrow">ASCENDER</p>
            <strong>{header.title}</strong>
          </div>
          <button
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkTheme ? "Ativar tema claro" : "Ativar tema escuro"}
            title={isDarkTheme ? "Ativar tema claro" : "Ativar tema escuro"}
          >
            {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <header className="topbar">
          <div>
            <p className="eyebrow">ASCENDER Solar Tech</p>
            <h1>{header.title}</h1>
            <span>{header.subtitle}</span>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={17} />
              <span>Sistema ASCENDER — SolisCloud com dados reais</span>
            </div>
            <button
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-label={isDarkTheme ? "Ativar tema claro" : "Ativar tema escuro"}
              title={isDarkTheme ? "Ativar tema claro" : "Ativar tema escuro"}
            >
              {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
              <span>{isDarkTheme ? "Claro" : "Escuro"}</span>
            </button>
            <button
              className="theme-toggle"
              type="button"
              onClick={handleLogout}
              title="Sair do sistema"
            >
              <LogOut size={18} />
              <span>Sair</span>
            </button>
          </div>
        </header>

        {activeModule ? (
          <section className="module-hero">
            <div className="module-hero-icon">
              <activeModule.icon size={28} />
            </div>
            <div>
              <p className="eyebrow">{activeModule.source}</p>
              <h2>{activeModule.title}</h2>
              <p>{activeModule.description}</p>
            </div>
          </section>
        ) : null}

        {children}
      </main>

      <MobileNav />
    </div>
  );
}
