import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";

function totalKcal(refeicoes) { return refeicoes.reduce((s, r) => s + (r.total_kcal || 0), 0); }

function statusPaciente(total, meta) {
  const pct = total / meta;
  if (total === 0)  return { label: "Sem registro", bg: "#F0EFE8", color: "#888" };
  if (pct < 0.5)   return { label: "Abaixo do mínimo", bg: "#FCEBEB", color: "#791F1F" };
  if (pct > 1.1)   return { label: "Acima do limite",  bg: "#FAEEDA", color: "#633806" };
  return             { label: "Na meta", bg: "#EEF7F2", color: "#0F6E56" };
}

function hora(isoStr) {
  if (!isoStr) return "";
  return new Date(isoStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function NutriDashboard() {
  const [pacientes, setPacientes]     = useState([]);
  const [refeicoes, setRefeicoes]     = useState({});
  const [selecionado, setSelecionado] = useState(null);
  const [busca, setBusca]             = useState("");
  const [carregando, setCarregando]   = useState(true);
  const [nota, setNota]               = useState({});
  const [notaEnviada, setNotaEnviada] = useState({});
  const [fotoModal, setFotoModal]     = useState(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true);
    const { data } = await supabase.from("pacientes").select("*").order("nome");
    if (data && data.length > 0) {
      setPacientes(data);
      setSelecionado(data[0]);
      await carregarRefeicoes(data[0].id);
    }
    setCarregando(false);
  }

  async function carregarRefeicoes(pacienteId) {
    const hoje = new Date().toISOString().split("T")[0];const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() - 7);
    const { data } = await supabase
       .from("refeicoes")
       .select(`*, alimentos(*)`)
       .eq("paciente_id", pacienteId)
       .gte("registrado_em", seteDias.toISOString())
       .order("registrado_em", { ascending: false });
    setRefeicoes(prev => ({ ...prev, [pacienteId]: data || [] }));
  }

  async function selecionarPaciente(p) {
    setSelecionado(p);
    if (!refeicoes[p.id]) await carregarRefeicoes(p.id);
  }

  function enviarNota(refeicaoId) {
    setNotaEnviada(prev => ({ ...prev, [refeicaoId]: true }));
  }

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    p.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const refSelecionado = selecionado ? (refeicoes[selecionado.id] || []) : [];
  const totalSel = totalKcal(refSelecionado);
  const metaSel  = selecionado?.meta_kcal || 1800;
  const pctSel   = Math.min(100, Math.round((totalSel / metaSel) * 100));
  const statusSel = selecionado ? statusPaciente(totalSel, metaSel) : null;

  const cores = ["#4CAF82","#378ADD","#D4537E","#EF9F27","#7F77DD","#E24B4A"];
  const bgs   = ["#EEF7F2","#E6F1FB","#FBEAF0","#FAEEDA","#EEEDFE","#FCEBEB"];

  return (
    <div style={{ fontFamily: "system-ui,sans-serif", minHeight: "calc(100vh - 52px)", display: "flex", flexDirection: "column", background: "#F7F5F0" }}>

      {/* Modal de foto ampliada */}
      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, cursor: "pointer" }}
        >
          <img src={fotoModal} alt="prato" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 16, objectFit: "contain" }} />
          <div style={{ position: "absolute", top: 20, right: 20, color: "white", fontSize: 28, cursor: "pointer" }}>✕</div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 260, background: "white", borderRight: "1px solid #F0EFE8", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "12px", borderBottom: "1px solid #F0EFE8" }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#1E5C3A", marginBottom: 8 }}>👩‍⚕️ Dra. Ana Oliveira</div>
          <input
            value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="🔍 Buscar paciente..."
            style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "7px 10px", fontSize: 13, outline: "none", background: "#F7F5F0", boxSizing: "border-box" }}
          />
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8, padding: "8px 12px 4px" }}>
          Pacientes ({pacientesFiltrados.length})
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {carregando ? (
            <div style={{ textAlign: "center", padding: 24, color: "#aaa", fontSize: 13 }}>Carregando...</div>
          ) : pacientesFiltrados.map((p, i) => {
            const ref = refeicoes[p.id] || [];
            const tot = totalKcal(ref);
            const st  = statusPaciente(tot, p.meta_kcal || 1800);
            const ativo = selecionado?.id === p.id;
            return (
              <div key={p.id} onClick={() => selecionarPaciente(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", cursor: "pointer", borderBottom: "1px solid #F7F5F0", background: ativo ? "#EEF7F2" : "white", borderLeft: ativo ? "3px solid #1E5C3A" : "3px solid transparent" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: bgs[i % bgs.length], color: cores[i % cores.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {p.nome?.split(" ").map(n => n[0]).slice(0, 2).join("") || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: ativo ? 700 : 500, color: ativo ? "#1E5C3A" : "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nome}</div>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{ref.length} refeição{ref.length !== 1 ? "ões" : ""} · {tot} kcal</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 99, background: st.bg, color: st.color, flexShrink: 0 }}>{st.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main */}
      {selecionado ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }}>

          {/* Header paciente */}
          <div style={{ background: "white", borderBottom: "1px solid #F0EFE8", padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#EEF7F2", color: "#1E5C3A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
              {selecionado.nome?.split(" ").map(n => n[0]).slice(0, 2).join("") || "?"}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a1a" }}>{selecionado.nome}</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>{selecionado.email} · Meta: {metaSel} kcal/dia · {selecionado.objetivo || "Saúde geral"}</div>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 99, background: statusSel?.bg, color: statusSel?.color }}>
                {statusSel?.label}
              </span>
            </div>
          </div>

          {/* Métricas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, padding: "12px 18px", flexShrink: 0 }}>
            {[
              { label: "Total consumido", val: totalSel, sub: "kcal hoje" },
              { label: "Meta diária",     val: metaSel,  sub: "kcal prescritos" },
              { label: "Saldo",           val: Math.abs(metaSel - totalSel), sub: totalSel > metaSel ? "kcal acima" : "kcal restantes" },
              { label: "Adesão",          val: pctSel + "%", sub: "da meta atingida" },
            ].map((m, i) => (
              <div key={i} style={{ background: "white", borderRadius: 12, padding: "10px 14px", border: "1px solid #F0EFE8" }}>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#1E5C3A" }}>{m.val}</div>
                <div style={{ fontSize: 11, color: "#aaa" }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Barra progresso */}
          <div style={{ padding: "0 18px 12px", flexShrink: 0 }}>
            <div style={{ background: "white", borderRadius: 12, padding: "10px 14px", border: "1px solid #F0EFE8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#aaa", marginBottom: 6 }}>
                <span>Progresso do dia</span><span>{pctSel}%</span>
              </div>
              <div style={{ background: "#F0EFE8", borderRadius: 99, height: 8, overflow: "hidden" }}>
                <div style={{ width: `${pctSel}%`, background: pctSel > 110 ? "#E24B4A" : pctSel < 50 ? "#EF9F27" : "#1E5C3A", height: "100%", borderRadius: 99, transition: "width 0.6s" }} />
              </div>
            </div>
          </div>

          {/* Refeições */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
              Refeições de hoje — {refSelecionado.length} registrada{refSelecionado.length !== 1 ? "s" : ""}
            </div>

            {refSelecionado.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#aaa" }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>📵</div>
                <div style={{ fontSize: 14 }}>Nenhuma refeição registrada hoje</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {refSelecionado.map(r => (
                  <div key={r.id} style={{ background: "white", borderRadius: 16, border: "1px solid #F0EFE8", overflow: "hidden" }}>

                    {/* Header refeição */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: "1px solid #F7F5F0" }}>
                      <div style={{ width: 36, height: 36, background: "#EEF7F2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        {r.nome?.includes("Café") ? "☕" : r.nome?.includes("Almoço") ? "🍽" : r.nome?.includes("Lanche") ? "🍎" : r.nome?.includes("Jantar") ? "🌙" : "🥗"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{r.nome}</div>
                        <div style={{ fontSize: 11, color: "#aaa" }}>{hora(r.registrado_em)}</div>
                      </div>
                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#1E5C3A" }}>{r.total_kcal}</div>
                        <div style={{ fontSize: 10, color: "#aaa" }}>kcal</div>
                      </div>
                    </div>

                    {/* FOTO REAL do Supabase */}
                    {r.foto_url ? (
                      <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setFotoModal(r.foto_url)}>
                        <img
                          src={r.foto_url}
                          alt="prato"
                          style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                          onError={e => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                        />
                        <div style={{ display: "none", height: 80, background: "#F7F5F0", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <span style={{ fontSize: 20, opacity: 0.3 }}>📷</span>
                          <span style={{ fontSize: 12, color: "#ccc" }}>Foto não disponível</span>
                        </div>
                        <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: 6, padding: "3px 8px", fontSize: 11 }}>
                          🔍 Ampliar
                        </div>
                      </div>
                    ) : (
                      <div style={{ height: 80, background: "#F7F5F0", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ fontSize: 20, opacity: 0.3 }}>📷</span>
                        <span style={{ fontSize: 12, color: "#ccc" }}>Sem foto registrada</span>
                      </div>
                    )}

                    {/* Alimentos */}
                    <div style={{ padding: "10px 14px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {(r.alimentos || []).map((a, i) => (
                        <div key={i} style={{ background: "#F7F5F0", borderRadius: 99, padding: "3px 10px", fontSize: 12, color: "#555", display: "flex", gap: 4 }}>
                          <span>{a.nome}</span>
                          <span style={{ color: "#1E5C3A", fontWeight: 700 }}>{a.calorias} kcal</span>
                        </div>
                      ))}
                    </div>

                    {/* Barra da refeição */}
                    <div style={{ padding: "4px 14px 10px" }}>
                      <div style={{ background: "#F0EFE8", borderRadius: 99, height: 4, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, Math.round(r.total_kcal / metaSel * 100))}%`, background: "#1E5C3A", height: "100%", borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#aaa", marginTop: 3 }}>{Math.round(r.total_kcal / metaSel * 100)}% da meta diária</div>
                    </div>

                    {/* Observação nutricionista */}
                    <div style={{ padding: "8px 14px 12px", borderTop: "1px solid #F7F5F0" }}>
                      {notaEnviada[r.id] ? (
                        <div style={{ background: "#EEF7F2", borderRadius: 10, padding: "8px 12px", fontSize: 12, color: "#1E5C3A", fontWeight: 500 }}>
                          ✅ Observação enviada ao paciente!
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                          <input
                            value={nota[r.id] || ""}
                            onChange={e => setNota(prev => ({ ...prev, [r.id]: e.target.value }))}
                            placeholder="Escreva uma observação para o paciente..."
                            style={{ flex: 1, border: "1px solid #E8E8E0", borderRadius: 10, padding: "8px 10px", fontSize: 12, outline: "none", background: "#F7F5F0" }}
                          />
                          <button onClick={() => enviarNota(r.id)} style={{ background: "#1E5C3A", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                            Enviar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 32, opacity: 0.3 }}>👈</div>
          <div style={{ fontSize: 14 }}>Selecione um paciente</div>
        </div>
      )}
    </div>
  );
}
