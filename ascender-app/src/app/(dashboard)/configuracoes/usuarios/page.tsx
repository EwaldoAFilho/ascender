import { CrudSection } from "@/components/cadastros/CrudSection";
import { excluirUsuario, salvarUsuario } from "@/lib/auth/actions";
import { listUsuarios } from "@/lib/auth/users";

export const dynamic = "force-dynamic";

export default async function UsuariosPage() {
  const usuarios = await listUsuarios();

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
      columns={["Nome", "E-mail", "Status"]}
      rows={usuarios.map((u) => ({
        id: u.id,
        cells: [
          u.nome,
          u.email,
          <span
            key="s"
            className={`status ${u.ativo ? "status-online" : "status-offline"}`}
          >
            {u.ativo ? "ativo" : "inativo"}
          </span>,
        ],
        sortValues: [u.nome, u.email, u.ativo ? "ativo" : "inativo"],
        values: {
          nome: u.nome,
          email: u.email,
          senha: "",
          ativo: u.ativo ? "true" : "false",
        },
      }))}
    />
  );
}
