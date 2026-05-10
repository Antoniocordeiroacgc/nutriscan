// src/lib/supabase.js
// Arquivo de conexão com o banco de dados do NutriScan
// Importe este arquivo em qualquer parte do app que precise acessar o banco

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ─────────────────────────────────────────────
// PACIENTES
// ─────────────────────────────────────────────

// Buscar todos os pacientes
export async function getPacientes() {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

// Buscar um paciente pelo ID
export async function getPaciente(id) {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// REFEIÇÕES
// ─────────────────────────────────────────────

// Buscar todas as refeições de um paciente hoje
export async function getRefeicoesDoDia(pacienteId) {
  const hoje = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('refeicoes')
    .select(`
      *,
      alimentos (*)
    `)
    .eq('paciente_id', pacienteId)
    .gte('registrado_em', `${hoje}T00:00:00`)
    .lte('registrado_em', `${hoje}T23:59:59`)
    .order('registrado_em', { ascending: true })
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────
// SALVAR REFEIÇÃO COMPLETA (foto + IA + alimentos)
// ─────────────────────────────────────────────

export async function salvarRefeicao(pacienteId, fotoFile, analiseIA) {
  // 1. Upload da foto
  const nomeArquivo = `${pacienteId}/${Date.now()}.jpg`
  const { error: uploadError } = await supabase.storage
    .from('fotos-refeicoes')
    .upload(nomeArquivo, fotoFile, { contentType: fotoFile.type })
  if (uploadError) throw uploadError

  // 2. Pegar URL pública da foto
  const { data: urlData } = supabase.storage
    .from('fotos-refeicoes')
    .getPublicUrl(nomeArquivo)
  const fotoUrl = urlData.publicUrl

  // 3. Salvar a refeição
  const { data: refeicao, error: refeicaoError } = await supabase
    .from('refeicoes')
    .insert({
      paciente_id: pacienteId,
      nome: analiseIA.refeicao,
      foto_url: fotoUrl,
      total_kcal: analiseIA.total_calorias
    })
    .select()
    .single()
  if (refeicaoError) throw refeicaoError

  // 4. Salvar cada alimento detectado pela IA
  const alimentosParaSalvar = analiseIA.alimentos.map(a => ({
    refeicao_id: refeicao.id,
    nome: a.nome,
    peso_g: a.peso_estimado_g,
    calorias: a.calorias,
    porcao: a.porcao
  }))
  const { error: alimentosError } = await supabase
    .from('alimentos')
    .insert(alimentosParaSalvar)
  if (alimentosError) throw alimentosError

  return { refeicao, fotoUrl }
}