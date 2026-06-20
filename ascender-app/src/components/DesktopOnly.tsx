import Link from "next/link";
import { ArrowLeft, Monitor } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Marca uma área de "trabalho" (cadastro/edição). No desktop renderiza os
 * children normalmente; em telas estreitas (<900px) troca pelo aviso de que a
 * área é melhor no computador. Tudo por CSS (sem JS de viewport) — evita flash
 * de hidratação. Funciona como Server Component.
 */
export function DesktopOnly({
  area,
  children,
}: {
  area?: string;
  children: ReactNode;
}) {
  return (
    <>
      <section className="desktop-only-notice">
        <div className="desktop-only-icon">
          <Monitor size={28} />
        </div>
        {area ? <p className="eyebrow">{area}</p> : null}
        <h2>Melhor no computador</h2>
        <p>
          Cadastros e edições ficam melhores na tela grande. No celular, o
          ASCENDER foca em <strong>acompanhar</strong> — geração, financeiro e
          alertas. Abra pelo computador para cadastrar e editar.
        </p>
        <Link href="/" className="btn-primary">
          <ArrowLeft size={16} /> Voltar ao início
        </Link>
      </section>
      <div className="desktop-only-content">{children}</div>
    </>
  );
}
