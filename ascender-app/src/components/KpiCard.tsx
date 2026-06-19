import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string;
  detail: string;
  tone?: "default" | "warning" | "success";
  icon: LucideIcon;
};

export function KpiCard({ title, value, detail, tone = "default", icon: Icon }: KpiCardProps) {
  return (
    <section className={`kpi-card tone-${tone}`}>
      <div className="kpi-icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2.1} />
      </div>
      <div>
        <span className="kpi-title">{title}</span>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </section>
  );
}
