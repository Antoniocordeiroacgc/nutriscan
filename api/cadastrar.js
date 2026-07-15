// api/cadastrar.js
// Cadastra um novo paciente com senha criptografada

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

  const {
    nome, email, senha, objetivo,
    meta_kcal, meta_proteina, meta_carb,
    meta_gordura, meta_fibra, meta_agua, peso_kg
  } = req.body;

  if (!nome || !email || !senha || !objetivo) {
    return res.status(400).json({ error: "Preencha todos os campos." });
  }

  try {
    // Verifica se email já existe
    const { data: existente } = await supabase
      .from("pacientes")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existente) {
      return res.status(400).json({ error: "Este e-mail já está cadastrado." });
    }

    // Criptografa a senha
    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const trialFim = new Date();
    trialFim.setDate(trialFim.getDate() + 30);

    const { data, error } = await supabase
      .from("pacientes")
      .insert({
        nome, email,
        senha: senhaCriptografada,
        objetivo,
        meta_kcal, meta_proteina, meta_carb,
        meta_gordura, meta_fibra, meta_agua,
        peso_kg: Number(peso_kg),
        plano: "teste",
        trial_inicio: new Date().toISOString(),
        trial_fim: trialFim.toISOString(),
        ativo: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Retorna os dados sem a senha
    const { senha: _, ...pacienteSemSenha } = data;
    return res.status(200).json(pacienteSemSenha);

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
