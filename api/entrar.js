// api/entrar.js
// Faz login verificando a senha criptografada

import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: "Preencha e-mail e senha." });
  }

  try {
    // Busca o paciente pelo email
    const { data: paciente, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;

    if (!paciente) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // Verifica a senha — funciona com senhas criptografadas E senhas antigas em texto puro
    let senhaCorreta = false;

    if (paciente.senha.startsWith("$2")) {
      // Senha já está criptografada com bcrypt
      senhaCorreta = await bcrypt.compare(senha, paciente.senha);
    } else {
      // Senha antiga em texto puro — compara direto e já criptografa para o futuro
      senhaCorreta = paciente.senha === senha;
      if (senhaCorreta) {
        const senhaCriptografada = await bcrypt.hash(senha, 10);
        await supabase
          .from("pacientes")
          .update({ senha: senhaCriptografada })
          .eq("id", paciente.id);
      }
    }

    if (!senhaCorreta) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // Retorna os dados sem a senha
    const { senha: _, ...pacienteSemSenha } = paciente;
    return res.status(200).json(pacienteSemSenha);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
