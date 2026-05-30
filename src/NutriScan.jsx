import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "./lib/supabase";
import Rodape from "./Rodape";

// ── Tabela TACO (kcal/100g) ───────────────────────────────
const TACO = {
  "abacate": 96, "abacaxi": 48, "açaí": 58, "acerola": 33,
  "banana": 92, "caju": 43, "caqui": 71, "carambola": 35,
  "cereja": 50, "coco": 354, "framboesa": 52, "goiaba": 54,
  "graviola": 62, "jabuticaba": 58, "jaca": 95, "laranja": 47,
  "limão": 32, "maçã": 56, "mamão": 40, "manga": 64,
  "maracujá": 68, "melancia": 33, "melão": 29, "morango": 30,
  "pera": 55, "pêssego": 43, "pitanga": 41, "romã": 68,
  "tangerina": 51, "uva": 69,
  "arroz branco": 128, "arroz integral": 124, "feijão carioca": 76,
  "feijão preto": 77, "lentilha": 93, "grão de bico": 164,
  "macarrão": 158, "pão francês": 300, "pão integral": 253,
  "tapioca": 347, "farinha de mandioca": 361, "cuscuz": 347,
  "frango grelhado": 159, "frango frito": 215, "carne bovina": 219,
  "carne suína": 276, "peixe grelhado": 116, "atum": 128,
  "salmão": 183, "camarão": 90, "ovo cozido": 146, "ovo frito": 185,
  "brócolis": 25, "cenoura": 34, "abobrinha": 18, "abóbora": 26,
  "chuchu": 19, "couve": 32, "espinafre": 23, "alface": 11,
  "tomate": 15, "beterraba": 37, "batata cozida": 52,
  "batata frita": 304, "batata doce": 77, "mandioca cozida": 125,
  "quiabo": 25, "jiló": 22, "berinjela": 17, "pimentão": 20,
  "milho cozido": 74, "palmito": 28,
  "leite integral": 61, "leite desnatado": 35, "iogurte natural": 51,
  "queijo minas": 264, "queijo prato": 358, "requeijão": 235,
  "manteiga": 726, "margarina": 533, "azeite": 884, "óleo": 884,
  "açúcar": 387, "mel": 309, "chocolate": 546, "sorvete": 207,
  "bolo de queijo": 320, "bolo de trigo": 344, "biscoito": 458,
};

function calcularCalorias(nome, pesoG) {
  const n = nome.toLowerCase().trim();
  for (const [alimento, cal100g] of Object.entries(TACO)) {
    if (n.includes(alimento) || alimento.includes(n)) {
      return Math.round((cal100g * pesoG) / 100);
    }
  }
  return null;
}

// ── API Claude ────────────────────────────────────────────
async function analisarComIA(base64Data) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: `Você é nutricionista brasileiro especialista na Tabela TACO.

Analise a foto com MÁXIMA ATENÇÃO visual. Diferencie:
- ABACATE: casca verde/escura rugosa, formato oval/periforme, polpa verde/amarela cremosa — NÃO confunda com pera
- PERA: casca lisa amarela/verde clara brilhante, formato de sino, polpa branca crocante
- CENOURA: laranja, cilíndrica e comprida, geralmente em rodelas ou palitos
- ABÓBORA: laranja, pedaços irregulares/cubos com casca grossa
- QUIABO: verde escuro, formato octogonal pontiagudo, textura aveludada
- PIMENTÃO: verde/vermelho/amarelo brilhante, largo, oco, paredes grossas
- BOLO DE QUEIJO: amarelado, textura densa, pequeno e arredondado, típico mineiro
- BOLO DE TRIGO: mais claro, textura esponjosa, mais alto e leve
- MAÇÃ: vermelha/verde, redonda, brilhante, casca lisa
- MANGA: amarela/laranja/verde, oval, polpa laranja/amarela

Use calorias EXATAS da tabela TACO brasileira.
Indique confiança 0-100 para cada alimento.

Responda SOMENTE JSON válido sem markdown:
{
  "refeicao": "nome da refeição",
  "alimentos": [
    {
      "nome": "nome exato em português",
      "peso_estimado_g": número,
      "calorias": número baseado TACO,
      "porcao": "descrição da porção",
      "confianca": número 0-100,
      "alternativa": "outro alimento possível se confiança < 80 ou null"
    }
  ],
  "total_calorias": número,
  "observacao": "comentário nutricional breve",
  "precisao_geral": número 0-100
}`,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Data } },
          { type: "text", text: "Analise este prato com máxima precisão visual e retorne o JSON nutricional TACO." }
        ]
      }]
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Erro ${response.status}`);
  }
  const data = await response.json();
  const text = data.content.map(b => b.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

async function salvarRefeicao(pacienteId, fotoFile, analise) {
  const nomeArq = `${pacienteId}/${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage
    .from("fotos-refeicoes")
    .upload(nomeArq, fotoFile, { contentType: "image/jpeg", upsert: true });
  if (upErr) throw upErr;
  const { data: urlData } = supabase.storage.from("fotos-refeicoes").getPublicUrl(nomeArq);
  const { data: ref, error: refErr } = await supabase
    .from("refeicoes")
    .insert({ paciente_id: pacienteId, nome: analise.refeicao, foto_url: urlData.publicUrl, total_kcal: analise.total_calorias })
    .select().single();
  if (refErr) throw refErr;
  if (analise.alimentos?.length > 0) {
    await supabase.from("alimentos").insert(
      analise.alimentos.map(a => ({ refeicao_id: ref.id, nome: a.nome, peso_g: a.peso_estimado_g, calorias: a.calorias, porcao: a.porcao }))
    );
  }
  return ref;
}

// ── Loading com etapas ────────────────────────────────────
function LoadingEtapas({ etapa }) {
  const etapas = [
    { icon: "📤", texto: "Enviando foto para análise..." },
    { icon: "🤖", texto: "IA identificando alimentos..." },
    { icon: "📊", texto: "Calculando calorias pela TACO..." },
    { icon: "✅", texto: "Quase pronto..." },
  ];
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 40, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>
        {etapas[etapa]?.icon || "🔄"}
      </div>
      <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 15, marginBottom: 16 }}>
        {etapas[etapa]?.texto}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
        {etapas.map((_, i) => (
          <div key={i} style={{ width: i <= etapa ? 24 : 8, height: 8, borderRadius: 99, background: i <= etapa ? "#1E5C3A" : "#E0E0E0", transition: "all 0.4s ease" }} />
        ))}
      </div>
    </div>
  );
}

function ConfBadge({ v, alt }) {
  const cor = v >= 90 ? "#0F6E56" : v >= 70 ? "#633806" : "#791F1F";
  const bg  = v >= 90 ? "#EEF7F2" : v >= 70 ? "#FAEEDA" : "#FCEBEB";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
      <div style={{ background: bg, color: cor, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
        {v >= 90 ? "✓" : v >= 70 ? "~" : "?"} {v}%
      </div>
      {alt && <div style={{ fontSize: 10, color: "#aaa" }}>ou: {alt}</div>}
    </div>
  );
}

export default function NutriScan({ paciente }) {
  const PACIENTE_ID = paciente?.id || "00000000-0000-0000-0000-000000000001";
  const meta = paciente?.meta_kcal || 1850;

  const [imagem, setImagem]             = useState(null);
  const [base64, setBase64]             = useState(null);
  const [fotoFile, setFotoFile]         = useState(null);
  const [status, setStatus]             = useState("idle");
  const [etapaLoading, setEtapaLoading] = useState(0);
  const [resultado, setResultado]       = useState(null);
  const [alimentos, setAlimentos]       = useState([]);
  const [erro, setErro]                 = useState("");
  const [enviado, setEnviado]           = useState(false);
  const fileRef = useRef();
  const timerRef = useRef();

  const iniciarLoading = () => {
    setEtapaLoading(0);
    timerRef.current = setInterval(() => {
      setEtapaLoading(prev => prev < 3 ? prev + 1 : 3);
    }, 2500);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const handleArquivo = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagem(e.target.result);
      setBase64(e.target.result.split(",")[1]);
      setStatus("idle"); setResultado(null);
      setEnviado(false); setErro(""); setAlimentos([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const analisar = async () => {
    if (!base64) return;
    setStatus("analisando"); setErro(""); setResultado(null);
    iniciarLoading();
    try {
      const analise = await analisarComIA(base64);
      clearInterval(timerRef.current);
      setResultado(analise);
      setAlimentos(analise.alimentos.map(a => ({ ...a, editandoNome: false, taco_atualizado: false })));
      setStatus("confirmando");
    } catch (e) {
      clearInterval(timerRef.current);
      setErro(e.message); setStatus("erro");
    }
  };

  // Atualiza nome E recalcula calorias pela TACO automaticamente
  const atualizarNome = (idx, novoNome) => {
    setAlimentos(prev => prev.map((a, i) => {
      if (i !== idx) return a;
      const novasCal = calcularCalorias(novoNome, a.peso_estimado_g);
      return {
        ...a,
        nome: novoNome,
        editandoNome: false,
        calorias: novasCal !== null ? novasCal : a.calorias,
        taco_atualizado: novasCal !== null,
      };
    }));
  };

  const atualizarCalorias = (idx, val) => {
    setAlimentos(prev => prev.map((a, i) => i === idx ? { ...a, calorias: Number(val) } : a));
  };

  const remover = (idx) => setAlimentos(prev => prev.filter((_, i) => i !== idx));

  const confirmarEEnviar = async () => {
    if (!resultado || !fotoFile) return;
    setStatus("salvando");
    const totalFinal = alimentos.reduce((s, a) => s + (Number(a.calorias) || 0), 0);
    try {
      await salvarRefeicao(PACIENTE_ID, fotoFile, { ...resultado, alimentos, total_calorias: totalFinal });
      setEnviado(true); setStatus("salvo");
    } catch (e) {
      setErro("Erro ao salvar: " + e.message); setStatus("erro");
    }
  };

  const reset = () => {
    setImagem(null); setBase64(null); setFotoFile(null);
    setResultado(null); setStatus("idle"); setEnviado(false);
    setErro(""); setAlimentos([]);
  };

  const totalConfirmado = alimentos.reduce((s, a) => s + (Number(a.calorias) || 0), 0);
  const pct = Math.min(100, Math.round((totalConfirmado / meta) * 100));
  const precisao = resultado?.precisao_geral || 0;
  const emojis = ["🍚","🫘","🥦","🍗","🥕","🍳","🐟","🥗","🧀","🍞","🥩","🍅","🥑","🍌","🍊","🍎","🥭","🍇"];

  return (
    <div style={{ minHeight: "calc(100vh - 52px)", background: "#F7F5F0", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
      `}</style>

      {/* Header verde */}
      <div style={{ background: "#1E5C3A", padding: "20px 16px 24px", color: "white" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Bom dia! 👋 {paciente?.nome?.split(" ")[0] || ""}</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Meu prato de hoje</div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Registrado</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{totalConfirmado} <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>kcal</span></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Meta</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{meta} <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>kcal</span></div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, background: "#7DFCA8", height: "100%", borderRadius: 99, transition: "width 0.8s" }} />
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 5 }}>{pct}% da meta</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>

        {/* Upload */}
        {status !== "confirmando" && !enviado && (
          <>
            <div
              onClick={() => !imagem && fileRef.current.click()}
              onDrop={e => { e.preventDefault(); handleArquivo(e.dataTransfer.files[0]); }}
              onDragOver={e => e.preventDefault()}
              style={{ border: imagem ? "none" : "2px dashed #C8E6D4", borderRadius: 20, overflow: "hidden", background: imagem ? "transparent" : "white", minHeight: imagem ? "auto" : 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: imagem ? "default" : "pointer", marginBottom: 12 }}
            >
              {imagem ? (
                <img src={imagem} alt="prato" style={{ width: "100%", borderRadius: 20, maxHeight: 280, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                  <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 16, marginBottom: 4 }}>Fotografar meu prato</div>
                  <div style={{ fontSize: 13, color: "#aaa" }}>Toque aqui para abrir a câmera</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleArquivo(e.target.files[0])} />
            </div>

            {imagem && status !== "analisando" && status !== "salvando" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={reset} style={{ flex: 1, background: "white", border: "1px solid #E8E8E0", borderRadius: 12, padding: 12, fontSize: 13, color: "#666", cursor: "pointer" }}>🔄 Trocar</button>
                <button onClick={analisar} style={{ flex: 2, background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>🔍 Analisar com IA</button>
              </div>
            )}

            {!imagem && (
              <button onClick={() => fileRef.current.click()} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                📷 Fotografar meu prato
              </button>
            )}
          </>
        )}

        {/* Loading */}
        {(status === "analisando" || status === "salvando") && (
          <LoadingEtapas etapa={status === "salvando" ? 3 : etapaLoading} />
        )}

        {/* Erro */}
        {status === "erro" && (
          <div style={{ background: "#FFF0F0", border: "1px solid #FFD0D0", borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#C00", marginBottom: 4 }}>⚠️ Erro</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{erro}</div>
            <button onClick={analisar} style={{ background: "#1E5C3A", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Tentar novamente</button>
          </div>
        )}

        {/* Confirmação */}
        {status === "confirmando" && resultado && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {imagem && <img src={imagem} alt="prato" style={{ width: "100%", borderRadius: 16, maxHeight: 200, objectFit: "cover", marginBottom: 12 }} />}

            {/* Precisão geral */}
            <div style={{ background: precisao >= 85 ? "#EEF7F2" : precisao >= 70 ? "#FAEEDA" : "#FCEBEB", border: `1px solid ${precisao >= 85 ? "#C8E6D4" : precisao >= 70 ? "#F0D9A0" : "#FFD0D0"}`, borderRadius: 12, padding: "10px 14px", marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ fontSize: 22 }}>{precisao >= 85 ? "🎯" : precisao >= 70 ? "⚠️" : "❓"}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: precisao >= 85 ? "#0F6E56" : precisao >= 70 ? "#633806" : "#791F1F" }}>
                  Precisão da análise: {precisao}%
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>
                  {precisao >= 85 ? "Boa precisão — confirme e envie!" : "Verifique os itens antes de enviar"}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              ✏️ Confirme — toque no nome para editar e recalcular pela TACO
            </div>

            {alimentos.map((a, i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "11px 14px", marginBottom: 8, border: `1px solid ${a.confianca < 70 ? "#FFD0D0" : a.confianca < 85 ? "#F0D9A0" : "#F0EFE8"}`, animation: `fadeUp 0.3s ease ${i * 0.05}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, background: "#EEF7F2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {emojis[i % emojis.length]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {a.editandoNome ? (
                      <input
                        defaultValue={a.nome}
                        autoFocus
                        onBlur={e => atualizarNome(i, e.target.value)}
                        onKeyDown={e => e.key === "Enter" && atualizarNome(i, e.target.value)}
                        style={{ width: "100%", border: "1.5px solid #1E5C3A", borderRadius: 6, padding: "4px 8px", fontSize: 13, fontWeight: 700, outline: "none", boxSizing: "border-box" }}
                      />
                    ) : (
                      <div onClick={() => setAlimentos(prev => prev.map((x, xi) => xi === i ? { ...x, editandoNome: true } : x))} style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", cursor: "text", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                        {a.nome}
                        <span style={{ fontSize: 11, color: "#1E5C3A" }}>✏️</span>
                        {a.taco_atualizado && (
                          <span style={{ fontSize: 10, color: "#0F6E56", background: "#EEF7F2", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>TACO ✓</span>
                        )}
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "#aaa" }}>{a.porcao} · {a.peso_estimado_g}g</span>
                      <input
                        type="number"
                        value={a.calorias}
                        onChange={e => atualizarCalorias(i, e.target.value)}
                        style={{ width: 58, border: "1px solid #E8E8E0", borderRadius: 6, padding: "2px 6px", fontSize: 12, outline: "none", color: "#1E5C3A", fontWeight: 700 }}
                      />
                      <span style={{ fontSize: 11, color: "#aaa" }}>kcal</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <ConfBadge v={a.confianca} alt={a.alternativa} />
                    <button onClick={() => remover(i)} style={{ background: "#FCEBEB", color: "#E24B4A", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>✕</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div style={{ background: "#1E5C3A", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, color: "white" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Total confirmado</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{totalConfirmado} <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>kcal</span></div>
            </div>

            {resultado.observacao && (
              <div style={{ background: "#EEF7F2", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 8, marginBottom: 12 }}>
                <span>💡</span>
                <div style={{ fontSize: 13, color: "#1E5C3A", lineHeight: 1.5 }}>{resultado.observacao}</div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={reset} style={{ flex: 1, background: "white", border: "1px solid #E8E8E0", borderRadius: 12, padding: 12, fontSize: 13, color: "#666", cursor: "pointer" }}>🔄 Nova foto</button>
              <button onClick={confirmarEEnviar} style={{ flex: 2, background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>✅ Confirmar e enviar</button>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {enviado && (
          <div style={{ background: "#EEF7F2", border: "1px solid #C8E6D4", borderRadius: 14, padding: 20, textAlign: "center", animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 16 }}>Refeição confirmada e enviada!</div>
            <div style={{ fontSize: 12, color: "#4CAF82", marginTop: 4 }}>A nutricionista já pode ver sua refeição</div>
            <button onClick={reset} style={{ marginTop: 14, background: "transparent", border: "1px solid #C8E6D4", borderRadius: 8, padding: "8px 20px", fontSize: 13, color: "#1E5C3A", cursor: "pointer", fontWeight: 600 }}>
              Registrar outra refeição
            </button>
          </div>
        )}
      </div>

      <Rodape />
    </div>
  );
}
