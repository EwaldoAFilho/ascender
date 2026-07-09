import { CrudSection } from "@/components/cadastros/CrudSection";
import { excluirUsuario, salvarUsuario } from "@/lib/auth/actions";
import { getSessionRole, roleAtLeast } from "@/lib/auth/rbac";
import { getSessionTenantId } from "@/lib/auth/tenant";
import { listMembros } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

const PAPEIS = [
  { value: "owner", label: "Owner (dono)" },
  { value: "admin", label: "Admin" },
  { value: "operador", label: "Operador" },
  { value: "leitura", label: "Leitura" },
];

export default async function UsuariosPage() {
  const role = await getSessionRole();
  if (!roleAtLeast(role, "admin")) {
    return (
      <section className="panel">
        <p style={{ color: "var(--muted)" }}>
          Você não tem permissão para gerenciar usuários (requer papel admin ou owner).
        </p>
      </section>
    );
  }

  const tenantId = await getSessionTenantId();
  const membros = await listMembros(tenantId);

  return (
    <CrudSection
      singular="usuário"
      onSave={salvarUsuario}
      onDelete={excluirUsuario}
      fields={[
        { name: "nome", label: "Nome", type: "text", required: true },
        { name: "email", label: "E-mail", type: "text", required: true },
        {
          name: "senha",
          label: "Senha (mín. 8 — em branco mantém ao editar)",
          type: "password",
          placeholder: "••••••••",
        },
        { name: "role", label: "Papel", type: "select", options: PAPEIS },
        {
          name: "ativo",
          label: "Status",
          type: "select",
          options: [
            { value: "true", label: "Ativo" },
            { value: "false", label: "Inativo" },
          ],
        },
      ]}
      columns={["Nome", "E-mail", "Papel", "Status"]}
      rows={membros.map((u) => ({
        id: u.id,
        cells: [
          u.nome,
          u.email,
          u.role,
          <span
            key="s"
            className={`status ${u.ativo ? "status-online" : "status-offline"}`}
          >
            {u.ativo ? "ativo" : "inativo"}
          </span>,
        ],
        sortValues: [u.nome, u.email, u.role, u.ativo ? "ativo" : "inativo"],
        values: {
          nome: u.nome,
          email: u.email,
          senha: "",
          role: u.role,
          ativo: u.ativo ? "true" : "false",
        },
      }))}
    />
  );
}
