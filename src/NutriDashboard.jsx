import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

function totalKcal(refs) { return refs.reduce((s, r) => s + (r.total_kcal || 0), 0); }

function statusPaciente(total, meta) {
  const pct = total / meta;
  if (total === 0) return { label: "Sem registro", bg: "#F0EFE8", color: "#888" };
  if (pct < 0.5) return { label: "Abaixo do mínimo", bg: "#FCEBEB", color: "#791F1F" };
  if (pct > 1.1) return { label: "Acima do limite", bg: "#FAEEDA", color: "#633806" };
  return { label: "Na meta", bg: "#EEF7F2", color: "#0F6E56" };
}

function hora(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

const CORES = ["#4CAF82", "#378ADD", "#D4537E", "#EF9F27", "#7F77DD", "#E24B4A"];
const BGS = ["#EEF7F2", "#E6F1FB", "#FBEAF0", "#FAEEDA", "#EEEDFE", "#FCEBEB"];

function Avatar({ nome, size = 40, idx = 0 }) {
  const initials = nome?.split(" ").map(n => n[0]).slice(0, 2).join("") || "?";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: BGS[idx % BGS.length], color: CORES[idx % CORES.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.33, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

// Tabela de nutrientes por alimento (simplificada para exibição)
function TabelaNutrientes({ alimentos }) {
  if (!alimentos || alimentos.length === 0) return null;

  const totais = alimentos.reduce((acc, a) => ({
    kcal: acc.kcal + (a.calorias || 0),
    prot: acc.prot + (a.prot || 0),
    carb: acc.carb + (a.carb || 0),
    lip: acc.lip + (a.lip || 0),
    fibra: acc.fibra + (a.fibra || 0),
  }), { kcal: 0, prot: 0, carb: 0, lip: 0, fibra: 0 });

  const cols = ["Alimento", "Porção", "Peso(g)", "Kcal", "Prot(g)", "Carb(g)", "Lip(g)", "Fibra(g)"];

  return (
    <div style={{ overflowX: "auto", margin: "8px 0" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
        <thead>
          <tr style={{ background: "#1E5C3A" }}>
            {cols.map((c, i) => (
              <th key={i} style={{ padding: "6px 10px", textAlign: i === 0 ? "left" : "center", color: "white", fontWeight: 700, whiteSpace: "nowrap" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alimentos.map((a, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "white" : "#F7F5F0", borderBottom: "1px solid #F0EFE8" }}>
              <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1a1a1a" }}>{a.nome}</td>
              <td style={{ padding: "6px 10px", color: "#666", textAlign: "center", whiteSpace: "nowrap" }}>{a.porcao || "—"}</td>
              <td style={{ padding: "6px 10px", color: "#666", textAlign: "center" }}>{a.peso_g || "—"}</td>
              <td style={{ padding: "6px 10px", fontWeight: 700, color: "#1E5C3A", textAlign: "center" }}>{a.calorias || 0}</td>
              <td style={{ padding: "6px 10px", color: "#378ADD", textAlign: "center", fontWeight: 600 }}>{a.prot ? `${a.prot}` : "—"}</td>
              <td style={{ padding: "6px 10px", color: "#EF9F27", textAlign: "center", fontWeight: 600 }}>{a.carb ? `${a.carb}` : "—"}</td>
              <td style={{ padding: "6px 10px", color: "#E24B4A", textAlign: "center", fontWeight: 600 }}>{a.lip ? `${a.lip}` : "—"}</td>
              <td style={{ padding: "6px 10px", color: "#4CAF82", textAlign: "center", fontWeight: 600 }}>{a.fibra ? `${a.fibra}` : "—"}</td>
            </tr>
          ))}
          {/* Linha de totais */}
          <tr style={{ background: "#EEF7F2", borderTop: "2px solid #1E5C3A" }}>
            <td style={{ padding: "7px 10px", fontWeight: 800, color: "#1E5C3A" }} colSpan={3}>TOTAL</td>
            <td style={{ padding: "7px 10px", fontWeight: 800, color: "#1E5C3A", textAlign: "center" }}>{totais.kcal}</td>
            <td style={{ padding: "7px 10px", fontWeight: 800, color: "#378ADD", textAlign: "center" }}>{Math.round(totais.prot * 10) / 10 || "—"}</td>
            <td style={{ padding: "7px 10px", fontWeight: 800, color: "#EF9F27", textAlign: "center" }}>{Math.round(totais.carb * 10) / 10 || "—"}</td>
            <td style={{ padding: "7px 10px", fontWeight: 800, color: "#E24B4A", textAlign: "center" }}>{Math.round(totais.lip * 10) / 10 || "—"}</td>
            <td style={{ padding: "7px 10px", fontWeight: 800, color: "#4CAF82", textAlign: "center" }}>{Math.round(totais.fibra * 10) / 10 || "—"}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontSize: 10, color: "#aaa", marginTop: 4, padding: "0 4px" }}>
        📋 Valores baseados na Tabela TACO — 4ª edição UNICAMP (591 alimentos)
      </div>
    </div>
  );
}

export default function NutriDashboard({ pacienteLogado }) {
  const [pacientes, setPacientes] = useState([]);
  const [refeicoes, setRefeicoes] = useState({});
  const [selecionado, setSelecionado] = useState(null);
  const [selIdx, setSelIdx] = useState(0);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [nota, setNota] = useState({});
  const [notaEnviada, setNotaEnviada] = useState({});
  const [fotoModal, setFotoModal] = useState(null);
  const [view, setView] = useState("lista");
  const [expandido, setExpandido] = useState({});

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase
      .from("pacientes")
      .select("*")
      .eq("id", pacienteLogado?.id)
      .order("nome");
    if (data?.length > 0) {
      setPacientes(data);
      await selecionarPaciente(data[0], 0);
    }
    setCarregando(false);
  }

  async function buscarRefeicoes(pacienteId) {
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() - 7);
    const { data } = await supabase
      .from("refeicoes")
      .select("*, alimentos(*)")
      .eq("paciente_id", pacienteId)
      .gte("registrado_em", seteDias.toISOString())
      .order("registrado_em", { ascending: false });
    return data || [];
  }

  async function selecionarPaciente(p, idx) {
    setSelecionado(p);
    setSelIdx(idx || 0);
    setView("detalhe");
    const refs = await buscarRefeicoes(p.id);
    setRefeicoes(prev => ({ ...prev, [p.id]: refs }));
  }

  const filtrados = pacientes.filter(p =>
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const refs = selecionado ? (refeicoes[selecionado.id] || []) : [];
  const total = totalKcal(refs);
  const meta = selecionado?.meta_kcal || 1800;
  const pct = Math.min(100, Math.round((total / meta) * 100));
  const st = selecionado ? statusPaciente(total, meta) : null;
  const progColor = pct > 110 ? "#E24B4A" : pct < 50 ? "#EF9F27" : "#1E5C3A";
  const isMobile = window.innerWidth < 768;

  // Totais gerais do dia
  const totalProt = refs.reduce((s, r) => s + (r.alimentos || []).reduce((a, al) => a + (al.prot || 0), 0), 0);
  const totalCarb = refs.reduce((s, r) => s + (r.alimentos || []).reduce((a, al) => a + (al.carb || 0), 0), 0);
  const totalLip = refs.reduce((s, r) => s + (r.alimentos || []).reduce((a, al) => a + (al.lip || 0), 0), 0);
  const totalFibra = refs.reduce((s, r) => s + (r.alimentos || []).reduce((a, al) => a + (al.fibra || 0), 0), 0);

  const Sidebar = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "white", borderRight: "1px solid #F0EFE8" }}>
      <div style={{ padding: "14px 12px", borderBottom: "1px solid #F0EFE8", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#1E5C3A", marginBottom: 8 }}>👩‍⚕️ Meu Painel</div>
        <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="🔍 Buscar..."
          style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "8px 10px", fontSize: 13, outline: "none", background: "#F7F5F0", boxSizing: "border-box" }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {carregando ? (
          <div style={{ textAlign: "center", padding: 24, color: "#aaa", fontSize: 13 }}>Carregando...</div>
        ) : filtrados.map((p, i) => {
          const r = refeicoes[p.id] || [];
          const tot = totalKcal(r);
          const s = statusPaciente(tot, p.meta_kcal || 1800);
          const ativo = selecionado?.id === p.id;
          return (
            <div key={p.id} onClick={() => selecionarPaciente(p, i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", cursor: "pointer", borderBottom: "1px solid #F7F5F0", background: ativo ? "#EEF7F2" : "white", borderLeft: `3px solid ${ativo ? "#1E5C3A" : "transparent"}` }}>
              <Avatar nome={p.nome} size={38} idx={i} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: ativo ? 700 : 500, color: ativo ? "#1E5C3A" : "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nome}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{r.length} refeição{r.length !== 1 ? "ões" : ""} · {tot} kcal</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: s.bg, color: s.color, flexShrink: 0 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const Detalhe = () => (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0 }}>

      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #F0EFE8", padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {isMobile && (
          <button onClick={() => setView("lista")} style={{ background: "#EEF7F2", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#1E5C3A", cursor: "pointer", fontWeight: 700, flexShrink: 0 }}>← Lista</button>
        )}
        <Avatar nome={selecionado?.nome} size={42} idx={selIdx} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selecionado?.nome}</div>
          <div style={{ fontSize: 11, color: "#aaa" }}>{selecionado?.objetivo || "Saúde geral"} · Meta: {meta} kcal</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: st?.bg, color: st?.color }}>{st?.label}</span>
          <button onClick={() => selecionarPaciente(selecionado, selIdx)} style={{ background: "transparent", border: "none", fontSize: 11, color: "#1E5C3A", cursor: "pointer", fontWeight: 600 }}>🔄 Atualizar</button>
        </div>
      </div>

      {/* Scroll */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "14px 16px" }}>

        {/* Métricas */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 12 }}>
          {[
            { label: "Calorias", val: total + " kcal", color: "#1E5C3A" },
            { label: "Meta", val: meta + " kcal", color: "#378ADD" },
            { label: "Saldo", val: Math.abs(meta - total) + (total > meta ? " acima" : " rest."), color: total > meta ? "#E24B4A" : "#EF9F27" },
            { label: "Adesão", val: pct + "%", color: progColor },
          ].map((m, i) => (
            <div key={i} style={{ background: "white", borderRadius: 12, padding: "10px 12px", border: "1px solid #F0EFE8" }}>
              <div style={{ fontSize: 11, color: "#aaa", marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.val}</div>
            </div>
          ))}
        </div>

        {/* Barra progresso */}
        <div style={{ background: "white", borderRadius: 12, padding: "10px 14px", border: "1px solid #F0EFE8", marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginBottom: 6 }}>
            <span>Progresso do dia</span><span>{pct}%</span>
          </div>
          <div style={{ background: "#F0EFE8", borderRadius: 99, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, background: progColor, height: "100%", borderRadius: 99, transition: "width 0.6s" }} />
          </div>
        </div>

        {/* Resumo macros do dia */}
        {refs.length > 0 && (
          <div style={{ background: "white", borderRadius: 12, padding: "12px 14px", border: "1px solid #F0EFE8", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
              📊 Macronutrientes do dia — Tabela TACO
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {[
                { icon: "💪", label: "Proteínas", val: Math.round(totalProt * 10) / 10, meta: selecionado?.meta_proteina, color: "#378ADD", bg: "#E6F1FB" },
                { icon: "🍞", label: "Carboidratos", val: Math.round(totalCarb * 10) / 10, meta: selecionado?.meta_carb, color: "#EF9F27", bg: "#FAEEDA" },
                { icon: "🥑", label: "Gorduras", val: Math.round(totalLip * 10) / 10, meta: selecionado?.meta_gordura, color: "#E24B4A", bg: "#FCEBEB" },
                { icon: "🌾", label: "Fibras", val: Math.round(totalFibra * 10) / 10, meta: selecionado?.meta_fibra, color: "#4CAF82", bg: "#EEF7F2" },
              ].map((m, i) => (
                <div key={i} style={{ background: m.bg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val || "—"}{m.val ? "g" : ""}</div>
                  {m.meta && (
                    <div style={{ fontSize: 10, color: m.color, opacity: 0.7, marginTop: 2 }}>meta: {m.meta}g</div>
                  )}
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{m.label}</div>
                  {m.meta && m.val > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.6)", borderRadius: 99, height: 3, marginTop: 4, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, Math.round(m.val / m.meta * 100))}%`, background: m.color, height: "100%", borderRadius: 99 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {selecionado?.peso_kg && (
              <div style={{ marginTop: 10, fontSize: 11, color: "#aaa", textAlign: "center" }}>
                ⚖️ Peso: {selecionado.peso_kg}kg · 💧 Água: {selecionado.meta_agua}ml/dia
              </div>
            )}
          </div>
        )}

        {/* Aviso IA */}
        <div style={{ background: "#FAEEDA", border: "1px solid #F0D9A0", borderRadius: 10, padding: "8px 12px", marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 16 }}>🤖</span>
          <div style={{ fontSize: 11, color: "#633806", lineHeight: 1.4 }}>
            <strong>Análise por IA:</strong> identificação visual pode ter imprecisões. Confirme os alimentos antes de enviar.
          </div>
        </div>

        {/* Refeições */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
          Refeições — {refs.length} registrada{refs.length !== 1 ? "s" : ""} (últimos 7 dias)
        </div>

        {refs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📵</div>
            <div>Nenhuma refeição registrada</div>
          </div>
        ) : refs.map(r => (
          <div key={r.id} style={{ background: "white", borderRadius: 16, border: "1px solid #F0EFE8", overflow: "hidden", marginBottom: 12 }}>

            {/* Header refeição */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #F7F5F0" }}>
              <div style={{ width: 36, height: 36, background: "#EEF7F2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                {r.nome?.includes("Café") ? "☕" : r.nome?.includes("Almoço") ? "🍽" : r.nome?.includes("Lanche") ? "🍎" : r.nome?.includes("Jantar") ? "🌙" : "🥗"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.nome}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{hora(r.registrado_em)}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1E5C3A" }}>{r.total_kcal}</div>
                <div style={{ fontSize: 10, color: "#aaa" }}>kcal</div>
              </div>
            </div>

            {/* Foto */}
            {r.foto_url ? (
              <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setFotoModal(r.foto_url)}>
                <img src={r.foto_url} alt="prato" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.55)", color: "white", borderRadius: 6, padding: "3px 8px", fontSize: 11 }}>🔍 Ampliar</div>
              </div>
            ) : (
              <div style={{ height: 60, background: "#F7F5F0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 16, opacity: 0.3 }}>📷</span>
                <span style={{ fontSize: 12, color: "#ccc" }}>Sem foto</span>
              </div>
            )}

            {/* Botão expandir tabela */}
            <div style={{ padding: "8px 14px", borderBottom: "1px solid #F7F5F0" }}>
              <button
                onClick={() => setExpandido(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                style={{ background: expandido[r.id] ? "#EEF7F2" : "#F7F5F0", border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#1E5C3A", cursor: "pointer", fontWeight: 600, width: "100%" }}
              >
                {expandido[r.id] ? "▲ Ocultar tabela nutricional" : "▼ Ver tabela nutricional completa (TACO)"}
              </button>
            </div>

            {/* Tabela nutricional expandível */}
            {expandido[r.id] && (
              <div style={{ padding: "0 14px 10px" }}>
                <TabelaNutrientes alimentos={r.alimentos || []} />
              </div>
            )}

            {/* Observação */}
            <div style={{ padding: "8px 14px 12px", borderTop: "1px solid #F7F5F0" }}>
              {notaEnviada[r.id] ? (
                <div style={{ background: "#EEF7F2", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#1E5C3A", fontWeight: 500 }}>
                  ✅ Observação enviada!
                </div>
              ) : (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    key={r.id}
                    defaultValue={nota[r.id] || ""}
                    onBlur={e => setNota(prev => ({ ...prev, [r.id]: e.target.value }))}
                    placeholder="Escreva uma observação..."
                    style={{ flex: 1, border: "1px solid #E8E8E0", borderRadius: 10, padding: "8px 10px", fontSize: 12, outline: "none", background: "#F7F5F0" }}
                  />
                  <button onClick={async () => {
                    const texto = nota[r.id]?.trim();
                    if (!texto) return;
                    await supabase.from("comentarios").insert({
                      refeicao_id: r.id,
                      paciente_id: selecionado.id,
                      texto,
                      nutricionista: "Nutricionista",
                    });
                    setNotaEnviada(prev => ({ ...prev, [r.id]: true }));
                  }} style={{ background: "#1E5C3A", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                    Enviar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div style={{ height: 20 }} />
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#F7F5F0" }}>

      {/* Modal foto */}
      {fotoModal && (
        <div onClick={() => setFotoModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, cursor: "pointer" }}>
          <img src={fotoModal} alt="prato" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 12, objectFit: "contain" }} />
          <div style={{ position: "absolute", top: 16, right: 20, color: "white", fontSize: 28, fontWeight: 700 }}>✕</div>
        </div>
      )}

      {/* MOBILE */}
      {isMobile && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "calc(100vh - 52px)", overflow: "hidden" }}>
          {view === "lista" ? <Sidebar /> : <Detalhe />}
        </div>
      )}

      {/* DESKTOP */}
      {!isMobile && (
        <div style={{ display: "flex", height: "calc(100vh - 52px)", overflow: "hidden" }}>
          <div style={{ width: 280, flexShrink: 0, height: "100%", overflow: "hidden" }}>
            <Sidebar />
          </div>
          {selecionado ? <Detalhe /> : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 32, opacity: 0.3 }}>👈</div>
              <div>Selecione um paciente</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
