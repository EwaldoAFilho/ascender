import { Link2 } from "lucide-react";

const LABEL: Record<string, string> = {
  digitalgrid: "Digital Grid",
  soliscloud: "SolisCloud",
};

function formatData(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

/**
 * Aviso de proveniência exibido no modal de edição de um cadastro que veio de
 * integração. Deixa claro quais campos a integração controla e que podem ser
 * sobrescritos na próxima sincronização.
 */
export function OrigemBanner({
  origem,
  sincronizadoEm,
  camposIntegracao,
}: {
  origem: string;
  sincronizadoEm: string | null;
  camposIntegracao: string[];
}) {
  const nome = LABEL[origem] ?? origem;
  const quando = formatData(sincronizadoEm);
  return (
    <div className="origem-banner">
      <Link2 size={16} />
      <div>
        <strong>Importado do {nome}</strong>
        {quando ? <span> · sincronizado em {quando}</span> : null}
        {camposIntegracao.length > 0 ? (
          <p>
            Os campos{" "}
            {camposIntegracao.map((campo, i) => (
              <span key={campo}>
                {i > 0 ? ", " : ""}
                <b>{campo}</b>
              </span>
            ))}{" "}
            vêm do {nome} e podem ser sobrescritos na próxima sincronização.
          </p>
        ) : null}
      </div>
    </div>
  );
}
