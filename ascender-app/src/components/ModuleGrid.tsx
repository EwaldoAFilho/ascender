"use client";

import { useRouter } from "next/navigation";
import { modules } from "@/lib/dashboard-data";

export function ModuleGrid() {
  const router = useRouter();
  return (
    <section className="module-grid">
      {modules.map((module) => (
        <button
          key={module.id}
          type="button"
          className={`module-card${module.scope === "desktop" ? " is-desktop-only" : ""}`}
          onClick={() => router.push(module.href)}
        >
          <div className="module-card-icon">
            <module.icon size={24} />
          </div>
          <div>
            <strong>{module.title}</strong>
            <span>{module.description}</span>
          </div>
        </button>
      ))}
    </section>
  );
}
