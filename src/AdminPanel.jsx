import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Rodape from "./Rodape";

const ADMIN_SENHA = "criaria2025";

export default function AdminPanel({ onSair }) {
  const [autenticado, setAutenticado] = useState(false);
  const [senha, setSenha]             = useState("");
  const [erro, setErro]               = useState("");
  const [aba, setAba]                 = useState("pacientes");
  const [pacientes, setPacientes]     = useState([]);
  const [contatos, setContatos]       = useState([]);
  const [refeicoes, setRefeicoes]     = useState({});
  const [carregando, setCarregando]   = useState(false);
  const [busca, setBusca]             = useState("");

  const entrar = () => {
    if (senha === ADMIN_SENHA) { setAutenticado(true); carregar(); }
    else setErro("Senha incorreta.");
  };

  const carregar = async () => {
    setCarregando(true);
    const { data: pac } = await supabase.from("pacientes").select("*").order("criado_em", { ascending: false });
    const { data: con } = await supabase.from("contatos").select("*").order("criado_em", { ascending: false });
    if (pac) setPacientes(pac);
    if (con) setContatos(con);
    const { data: refs } = await supabase.from("refeicoes").select("paciente_id");
    if (refs) {
      const contagem = {};
      refs.forEach(r => { contagem[r.paciente_id] = (contagem[r.paciente_id] || 0) + 1; });
      setRefeicoes(contagem);
    }
    setCarregando(false);
  };

  const marcarRespondido = async (id) => {
    await supabase.from("contatos").update({ respondido: true }).eq("id", id);
    setContatos(prev => prev.map(c => c.id === id ? { ...c, respondido: true } : c));
  };

  const excluirPaciente = async (id, nome) => {
    if (!window.confirm(`Excluir o paciente "${nome}"?\n\nIsso vai apagar todas as refeições e fotos. Esta ação não pode ser desfeita.`)) return;
    const { data: refs } = await supabase.from("refeicoes").select("id").eq("paciente_id", id);
    if (refs?.length > 0) {
      await supabase.from("alimentos").delete().in("refeicao_id", refs.map(r => r.id));
    }
    await supabase.from("refeicoes").delete().eq("paciente_id", id);
    await supabase.from("pacientes").delete().eq("id", id);
    setPacientes(prev => prev.filter(p => p.id !== id));
  };

  const togglePagamento = async (id, pago) => {
    await supabase.from("pacientes").update({ pago: !pago }).eq("id", id);
    setPacientes(prev => prev.map(p => p.id === id ? { ...p, pago: !pago } : p));
  };

  const diasRestantes = (trialFim) => {
    if (!trialFim) return 30;
    const diff = new Date(trialFim) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const formatarData = (data) => {
    if (!data) return "—";
    return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const contatosFiltrados = contatos.filter(c =>
    c.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    c.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalRefeicoes  = Object.values(refeicoes).reduce((s, v) => s + v, 0);
  const ativos          = pacientes.filter(p => diasRestantes(p.trial_fim) > 0).length;
  const naoRespondidos  = contatos.filter(c => !c.respondido).length;
  const inadimplentes   = pacientes.filter(p => !p.pago && diasRestantes(p.trial_fim) === 0).length;

  if (!autenticado) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "#1a1a1a", borderRadius: 20, padding: 32, width: "100%", maxWidth: 360, border: "0.5px solid #333", marginBottom: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "white" }}>Painel Admin</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>CRIAR.IA TECNOLOGIA</div>
          </div>
          <input value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === "Enter" && entrar()} placeholder="Senha de acesso" type="password"
            style={{ width: "100%", background: "#222", border: "0.5px solid #333", borderRadius: 10, padding: "12px 14px", fontSize: 14, color: "white", outline: "none", boxSizing: "border-box", marginBottom: 12 }} />
          {erro && <div style={{ color: "#E24B4A", fontSize: 12, marginBottom: 10 }}>{erro}</div>}
          <button onClick={entrar} style={{ width: "100%", background: "#1E5C3A", color: "#7DFCA8", border: "none", borderRadius: 10, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Acessar painel</button>
          <button onClick={onSair} style={{ width: "100%", background: "transparent", color: "#555", border: "none", fontSize: 12, cursor: "pointer", marginTop: 8, padding: 6 }}>← Voltar ao app</button>
        </div>
        <Rodape dark />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ background: "#1E5C3A", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
        <div>
          <div style={{ fontWeight: 800, color: "white", fontSize: 15 }}>⚙️ Painel Admin — NutriScan</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>CRIAR.IA TECNOLOGIA</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={carregar} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>🔄 Atualizar</button>
          <button onClick={onSair} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" }}>← Voltar</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "16px 20px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 16 }}>
          {[
            { label: "Total cadastrados", val: pacientes.length, icon: "👥", color: "#1E5C3A" },
            { label: "Usuários ativos",   val: ativos,           icon: "✅", color: "#378ADD" },
            { label: "Refeições",         val: totalRefeicoes,   icon: "🍽️", color: "#EF9F27" },
            { label: "Inadimplentes",     val: inadimplentes,    icon: "💰", color: inadimplentes > 0 ? "#E24B4A" : "#888" },
            { label: "Contatos novos",    val: naoRespondidos,   icon: "💬", color: naoRespondidos > 0 ? "#E24B4A" : "#888" },
          ].map((m, i) => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: "12px 14px", border: "1px solid #F0EFE8" }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.val}</div>
              <div style={{ fontSize: 11, color: "#aaa" }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Abas + Busca */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
          <button onClick={() => setAba("pacientes")} style={{ background: aba === "pacientes" ? "#1E5C3A" : "white", color: aba === "pacientes" ? "white" : "#666", border: "1px solid #E8E8E0", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            👥 Pacientes ({pacientes.length})
          </button>
          <button onClick={() => setAba("contatos")} style={{ background: aba === "contatos" ? "#1E5C3A" : "white", color: aba === "contatos" ? "white" : "#666", border: `1px solid ${naoRespondidos > 0 ? "#E24B4A" : "#E8E8E0"}`, borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            💬 Contatos ({contatos.length})
            {naoRespondidos > 0 && <span style={{ background: "#E24B4A", color: "white", borderRadius: 99, fontSize: 10, fontWeight: 700, padding: "1px 6px", marginLeft: 6 }}>{naoRespondidos}</span>}
          </button>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar..." style={{ flex: 1, minWidth: 150, border: "1px solid #E8E8E0", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", background: "white" }} />
        </div>

        {/* ABA PACIENTES */}
        {aba === "pacientes" && (
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #F0EFE8", overflow: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#F7F5F0" }}>
                  {["Nome", "E-mail", "Objetivo", "Cadastro", "Refeições", "Dias", "Mensalidade", "Status", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>Carregando...</td></tr>
                ) : pacientesFiltrados.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: "center", padding: 32, color: "#aaa" }}>Nenhum paciente encontrado</td></tr>
                ) : pacientesFiltrados.map((p, i) => {
                  const dias = diasRestantes(p.trial_fim);
                  const refs = refeicoes[p.id] || 0;
                  const ativo = dias > 0;
                  const pago = p.pago || false;
                  const expirado = !ativo;
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #F7F5F0", background: i % 2 === 0 ? "white" : "#FAFAF8" }}>
                      <td style={{ padding: "11px 14px", fontWeight: 600, color: "#1a1a1a", whiteSpace: "nowrap" }}>{p.nome}</td>
                      <td style={{ padding: "11px 14px", color: "#666" }}>{p.email}</td>
                      <td style={{ padding: "11px 14px", color: "#555", whiteSpace: "nowrap" }}>{p.objetivo || "Saúde geral"}</td>
                      <td style={{ padding: "11px 14px", color: "#888", whiteSpace: "nowrap" }}>{formatarData(p.criado_em)}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: refs > 0 ? "#1E5C3A" : "#ccc" }}>{refs}</td>
                      <td style={{ padding: "11px 14px", fontWeight: 700, color: dias <= 5 ? "#E24B4A" : dias <= 10 ? "#EF9F27" : "#1E5C3A", whiteSpace: "nowrap" }}>
                        {ativo ? `${dias}d` : "Expirado"}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        {expirado ? (
                          <button
                            onClick={() => togglePagamento(p.id, pago)}
                            style={{ background: pago ? "#EEF7F2" : "#FCEBEB", color: pago ? "#0F6E56" : "#E24B4A", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                          >
                            {pago ? "✓ Pago" : "✕ Não pago"}
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: "#aaa" }}>Em teste</span>
                        )}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{ background: ativo ? "#EEF7F2" : "#F0EFE8", color: ativo ? "#0F6E56" : "#888", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                          {ativo ? "✓ Ativo" : "Expirado"}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <button onClick={() => excluirPaciente(p.id, p.nome)} style={{ background: "#FCEBEB", color: "#E24B4A", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>🗑️</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ABA CONTATOS */}
        {aba === "contatos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {contatosFiltrados.length === 0 ? (
              <div style={{ background: "white", borderRadius: 16, padding: 32, textAlign: "center", color: "#aaa", border: "1px solid #F0EFE8" }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>💬</div>
                <div>Nenhum contato recebido ainda</div>
              </div>
            ) : contatosFiltrados.map(c => (
              <div key={c.id} style={{ background: "white", borderRadius: 16, padding: "16px 18px", border: `1px solid ${c.respondido ? "#F0EFE8" : "#FFD0D0"}`, opacity: c.respondido ? 0.75 : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", marginBottom: 2 }}>{c.nome}</div>
                    <div style={{ fontSize: 12, color: "#666", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>📧 {c.email}</span>
                      {c.celular && <span>📱 {c.celular}</span>}
                      <span style={{ color: "#aaa" }}>🕐 {new Date(c.criado_em).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                    <a href={`mailto:${c.email}`} style={{ background: "#1E5C3A", color: "white", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>✉️ Responder</a>
                    {c.celular && (
                      <a href={`https://wa.me/55${c.celular.replace(/\D/g,"")}`} target="_blank" rel="noopener noreferrer" style={{ background: "#25D366", color: "white", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>💬 WhatsApp</a>
                    )}
                    {!c.respondido ? (
                      <button onClick={() => marcarRespondido(c.id)} style={{ background: "#EEF7F2", color: "#0F6E56", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>✓ Respondido</button>
                    ) : (
                      <span style={{ background: "#EEF7F2", color: "#0F6E56", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 600 }}>✓ Respondido</span>
                    )}
                  </div>
                </div>
                <div style={{ background: "#F7F5F0", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#444", lineHeight: 1.6 }}>{c.mensagem}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#bbb" }}>
          {aba === "pacientes" ? `${pacientesFiltrados.length} paciente${pacientesFiltrados.length !== 1 ? "s" : ""}` : `${contatosFiltrados.length} contato${contatosFiltrados.length !== 1 ? "s" : ""}`}
        </div>
      </div>
      <Rodape />
    </div>
  );
}
