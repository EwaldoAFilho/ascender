import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Factory,
  FileText,
  GitCompareArrows,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import { getCadastrosResumo } from "@/lib/cadastros/queries";
import { numberFormatter } from "@/lib/dashboard-data";

export const dynamic = "force-dynamic";

type HubCard = {
  href: string;
  title: string;
  icon: LucideIcon;
  value: string;
  hint: string;
  accent?: boolean;
};

export default async function CadastrosHubPage() {
  const r = await getCadastrosResumo();

  const cards: HubCard[] = [
    {
      href: "/cadastros/usinas",
      title: "Usinas",
      icon: Sun,
      value: numberFormatter.format(r.usinas.total),
      hint: `${numberFormatter.format(r.usinas.kwp)} kWp · ${r.usinas.comSolis} na SolisCloud`,
    },
    {
      href: "/cadastros/clientes",
      title: "Clientes",
      icon: Users,
      value: numberFormatter.format(r.clientes.total),
      hint: `${r.clientes.ativos} ativo(s)`,
    },
    {
      href: "/cadastros/unidades",
      title: "Unidades consumidoras",
      icon: Building2,
      value: numberFormatter.format(r.unidades.total),
      hint: "UCs cadastradas",
    },
    {
      href: "/cadastros/contratos",
      title: "Contratos",
      icon: FileText,
      value: numberFormatter.format(r.contratos.total),
      hint: `${r.contratos.ativos} ativo(s)`,
    },
    {
      href: "/cadastros/distribuidoras",
      title: "Distribuidoras",
      icon: Factory,
      value: numberFormatter.format(r.distribuidoras.total),
      hint: "concessionárias",
    },
    {
      href: "/cadastros/conciliacao",
      title: "Conciliação",
      icon: GitCompareArrows,
      value: `${r.usinas.comDg}`,
      hint: "usinas vinculadas ao Digital Grid",
      accent: true,
    },
  ];

  return (
    <section className="registry-grid">
      {cards.map((card) => (
        <Link
          key={card.href}
          href={card.href}
          className={`registry-card${card.accent ? " is-accent" : ""}`}
        >
          <div className="registry-card-top">
            <span className="registry-card-icon">
              <card.icon size={22} />
            </span>
            <span className="registry-card-title">{card.title}</span>
          </div>
          <strong className="registry-card-value">{card.value}</strong>
          <span className="registry-card-hint">{card.hint}</span>
          <span className="registry-card-cta">
            Abrir <ArrowRight size={15} />
          </span>
        </Link>
      ))}
    </section>
  );
}
