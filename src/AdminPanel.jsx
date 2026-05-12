import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

const ADMIN_SENHA = "criaria2025"; // Senha do painel admin

export default function AdminPanel({ onSair }) {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [pacientes, setPacientes] = useState([]);
  const [refeicoes, setRefeicoes] = useState({});
  const [carregando, setCarregando] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const entrar = () => {
    if (senha === ADMIN_SENHA) { setAutenticado(true); carregar(); }
    else setErro("Senha incorreta.");
  };

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase
      .from("pacientes")
      .select("*")
      .order("criado_em", { ascending: false });
    if (data) {
      setPacientes(data);
      // Contar refeições por paciente
      const { data: refs } = await supabase
        .from("refeicoes")
        .select("paciente_id");
      if (refs) {
        const contagem = {};
        refs.forEach(r => { contagem[r.paciente_id] = (contagem[r.paciente_id] || 0) + 1; });
        setRefeicoes(contagem);
      }
    }
    setCarregando(false);
  };

  const diasRestantes = (trialFim) => {
    if (!trialFim) return 30;
    const diff = new Date(trialFim) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const filtrados = pacientes.filter(p => {
    const matchBusca = p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                       p.email?.toLowerCase().includes(busca.toLowerCase());
    if (filtro === "ativos") return matchBusca && diasRestantes(p.trial_fim) > 0;
    if (filtro === "expirados") return matchBusca && diasRestantes(p.trial_fim) === 0;
    return matchBusca;
  });

  const totalRefeicoes = Object.values(refeicoes).reduce((s, v) => s + v, 0);
  const ativos = pacientes.filter(p => diasRestantes(p.trial_fim) > 0).length;

  if (!autenticado) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0A0A0A",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24, fontFamily: "system-ui, sans-serif"
      }}>
        <div style={{ background: "#1a1a1a", borderRadius: 20, padding: 32, width: "100%", maxWidth: 360, border: "0.5px solid #333" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "white" }}>Painel Admin</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>CRIAR.IA TECNOLOGIA</div>
          </div>
          <input
            value={senha} onChange={e => setSenha(e.target.value)}
            onKeyDown={e => e.key === "Enter" && entrar()}
            placeholder="Senha de acesso"
            type="password"
            style={{
              width: "100%", background: "#222", border: "0.5px solid #333",
              borderRadius: 10, padding: "12px 14px", fontSize: 14,
              color: "white", outline: "none", boxSizing: "border-box", marginBottom: 12
            }}
          />
          {erro && <div style={{ color: "#E24B4A", fontSize: 12, marginBottom: 10 }}>{erro}</div>}
          <button
            onClick={entrar}
            style={{
              width: "100%", background: "#1E5C3A", color: "#7DFCA8",
              border: "none", borderRadius: 10, padding: 12,
              fontSize: 14, fontWeight: 700, cursor: "pointer"
            }}
          >
            Acessar painel
          </button>
          <button onClick={onSair} style={{ width: "100%", background: "transparent", color: "#555", border: "none", fontSize: 12, cursor: "pointer", marginTop: 8, padding: 6 }}>
            ← Voltar ao app
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0", fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#1E5C3A", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontWeight: 800, color: "white", fontSize: 16 }}>⚙️ Painel Admin — NutriScan</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>CRIAR.IA TECNOLOGIA</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={carregar} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
            🔄 Atualizar
          </button>
          <button onClick={onSair} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>
            ← Voltar
          </button>
        </div>
      </div>

      <div style={{ padding: "16px 20px", maxWidth: 1000, margin: "0 auto" }}>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total cadastrados", val: pacientes.length, icon: "👥", color: "#1E5C3A" },
            { label: "Usuários ativos", val: ativos, icon: "✅", color: "#378ADD" },
            { label: "Refeições registradas", val: totalRefeicoes, icon: "🍽️", color: "#EF9F27" },
            { label: "Dias de teste", val: "30", icon: "📅", color: "#7F77DD" },
          ].map((m, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: "14px 16px", border: "1px solid #F0EFE8" }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: m.color }}>{m.val}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Banner aviso teste */}
        <div style={{ background: "#1E5C3A", borderRadius: 14, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🧪</span>
          <div>
            <div style={{ fontWeight: 700, color: "#7DFCA8", fontSize: 13 }}>Período de testes ativo</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              Todos os usuários têm acesso grátis por 30 dias. Acompanhe o engajamento abaixo.
            </div>
          </div>
        </div>

        {/* Busca e filtros */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="🔍  Buscar por nome ou e-mail..."
            style={{ flex: 1, border: "1px solid #E8E8E0", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", background: "white" }}
          />
          {["todos", "ativos", "expirados"].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              background: filtro === f ? "#1E5C3A" : "white",
              color: filtro === f ? "white" : "#666",
              border: "1px solid #E8E8E0", borderRadius: 10,
              padding: "8px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              textTransform: "capitalize"
            }}>{f}</button>
          ))}
        </div>

        {/* Tabela de usuários */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0EFE8", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 1fr", padding: "10px 16px", background: "#F7F5F0", borderBottom: "1px solid #F0EFE8" }}>
            {["Nome", "E-mail", "Objetivo", "Refeições", "Dias restantes", "Status"].map((h, i) => (
              <div key={i} style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
            ))}
          </div>

          {carregando ? (
            <div style={{ textAlign: "center", padding: 32, color: "#aaa" }}>Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "#aaa" }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>👥</div>
              <div>Nenhum usuário encontrado</div>
            </div>
          ) : filtrados.map((p, i) => {
            const dias = diasRestantes(p.trial_fim);
            const refs = refeicoes[p.id] || 0;
            const ativo = dias > 0;
            return (
              <div key={p.id} style={{
                display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 1fr",
                padding: "12px 16px", borderBottom: "1px solid #F7F5F0",
                background: i % 2 === 0 ? "white" : "#FAFAF8",
                alignItems: "center"
              }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{p.nome || "—"}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{p.email}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{p.objetivo || "Saúde geral"}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: refs > 0 ? "#1E5C3A" : "#ccc" }}>{refs}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: dias <= 5 ? "#E24B4A" : dias <= 10 ? "#EF9F27" : "#1E5C3A" }}>
                  {dias}d
                </div>
                <div>
                  <span style={{
                    background: ativo ? "#EEF7F2" : "#F0EFE8",
                    color: ativo ? "#0F6E56" : "#888",
                    borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700
                  }}>
                    {ativo ? "✓ Ativo" : "Expirado"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#bbb" }}>
          {filtrados.length} usuário{filtrados.length !== 1 ? "s" : ""} encontrado{filtrados.length !== 1 ? "s" : ""}
        </div>
      </div>
    </div>
  );
}
