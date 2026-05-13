import { useState, useRef, useCallback } from "react";
import { supabase } from "./lib/supabase";

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
      system: `Você é um especialista em nutrição brasileiro com profundo conhecimento da Tabela TACO (Tabela Brasileira de Composição de Alimentos).

Analise a foto do prato com MÁXIMA ATENÇÃO aos detalhes visuais:
- Observe cor, textura, formato e contexto de cada alimento
- Diferencie alimentos similares: cenoura (laranja, cilíndrica) vs abóbora (laranja, irregular/chunks)
- Diferencie: quiabo (verde, octogonal, com okra) vs pimentão (verde, oco, brilhante)
- Use as porções típicas brasileiras da tabela TACO

Para cada alimento, indique sua confiança visual de 0 a 100%.
- 90-100%: certeza visual clara
- 70-89%: provável mas pode haver dúvida
- 50-69%: incerto, alimento similar pode confundir
- abaixo de 50%: muito incerto

Responda SOMENTE com JSON válido, sem markdown:
{
  "refeicao": "nome descritivo da refeição",
  "alimentos": [
    {
      "nome": "nome exato do alimento em português",
      "peso_estimado_g": número inteiro,
      "calorias": número inteiro,
      "porcao": "descrição da porção ex: 4 colheres, 1 concha, 100g",
      "confianca": número de 0 a 100,
      "alternativa": "outro alimento possível se confiança < 80, ou null"
    }
  ],
  "total_calorias": número inteiro,
  "observacao": "comentário nutricional breve em português",
  "precisao_geral": número de 0 a 100
}`,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Data } },
          { type: "text", text: "Analise este prato com máxima precisão e retorne o JSON nutricional completo." }
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

async function salvarRefeicaoCompleta(pacienteId, fotoFile, analiseIA) {
  const nomeArquivo = `${pacienteId}/${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("fotos-refeicoes")
    .upload(nomeArquivo, fotoFile, { contentType: "image/jpeg", upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("fotos-refeicoes").getPublicUrl(nomeArquivo);
  const fotoUrl = urlData.publicUrl;

  const { data: refeicao, error: refeicaoError } = await supabase
    .from("refeicoes")
    .insert({ paciente_id: pacienteId, nome: analiseIA.refeicao, foto_url: fotoUrl, total_kcal: analiseIA.total_calorias })
    .select().single();
  if (refeicaoError) throw refeicaoError;

  if (analiseIA.alimentos?.length > 0) {
    await supabase.from("alimentos").insert(
      analiseIA.alimentos.map(a => ({
        refeicao_id: refeicao.id,
        nome: a.nome,
        peso_g: a.peso_estimado_g,
        calorias: a.calorias,
        porcao: a.porcao
      }))
    );
  }
  return { refeicao, fotoUrl };
}

function ConfidenceBadge({ confianca, alternativa }) {
  const cor = confianca >= 90 ? "#0F6E56" : confianca >= 70 ? "#633806" : "#791F1F";
  const bg  = confianca >= 90 ? "#EEF7F2" : confianca >= 70 ? "#FAEEDA" : "#FCEBEB";
  const ico = confianca >= 90 ? "✓" : confianca >= 70 ? "~" : "?";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-end" }}>
      <div style={{ background: bg, color: cor, borderRadius: 99, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
        {ico} {confianca}%
      </div>
      {alternativa && (
        <div style={{ fontSize: 10, color: "#aaa", textAlign: "right" }}>
          ou: {alternativa}
        </div>
      )}
    </div>
  );
}

export default function NutriScan({ paciente }) {
  const PACIENTE_ID = paciente?.id || "00000000-0000-0000-0000-000000000001";

  const [imagem, setImagem]       = useState(null);
  const [base64, setBase64]       = useState(null);
  const [fotoFile, setFotoFile]   = useState(null);
  const [status, setStatus]       = useState("idle");
  const [resultado, setResultado] = useState(null);
  const [alimentosEdit, setAlimentosEdit] = useState([]);
  const [erro, setErro]           = useState("");
  const [enviado, setEnviado]     = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const fileRef = useRef();

  const handleArquivo = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagem(dataUrl);
      setBase64(dataUrl.split(",")[1]);
      setStatus("idle"); setResultado(null);
      setEnviado(false); setErro("");
      setConfirmando(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const analisar = async () => {
    if (!base64) return;
    setStatus("analisando"); setErro(""); setResultado(null); setConfirmando(false);
    try {
      const analise = await analisarComIA(base64);
      setResultado(analise);
      setAlimentosEdit(analise.alimentos.map(a => ({ ...a, editando: false })));
      setStatus("confirmando");
      setConfirmando(true);
    } catch (e) {
      setErro(e.message); setStatus("erro");
    }
  };

  const atualizarAlimento = (idx, campo, valor) => {
    setAlimentosEdit(prev => prev.map((a, i) => i === idx ? { ...a, [campo]: valor } : a));
  };

  const removerAlimento = (idx) => {
    setAlimentosEdit(prev => prev.filter((_, i) => i !== idx));
  };

  const confirmarEEnviar = async () => {
    if (!resultado || !fotoFile) return;
    setStatus("salvando");
    const analiseConfirmada = {
      ...resultado,
      alimentos: alimentosEdit,
      total_calorias: alimentosEdit.reduce((s, a) => s + (Number(a.calorias) || 0), 0)
    };
    try {
      await salvarRefeicaoCompleta(PACIENTE_ID, fotoFile, analiseConfirmada);
      setEnviado(true); setStatus("salvo"); setConfirmando(false);
    } catch (e) {
      setErro("Erro ao salvar: " + e.message); setStatus("erro");
    }
  };

  const reset = () => {
    setImagem(null); setBase64(null); setFotoFile(null);
    setResultado(null); setStatus("idle"); setEnviado(false);
    setErro(""); setConfirmando(false); setAlimentosEdit([]);
  };

  const totalConfirmado = alimentosEdit.reduce((s, a) => s + (Number(a.calorias) || 0), 0);
  const meta = paciente?.meta_kcal || 1850;
  const pct  = Math.min(100, Math.round((totalConfirmado / meta) * 100));
  const precisaoGeral = resultado?.precisao_geral || 0;
  const emojis = ["🍚","🫘","🥦","🍗","🥕","🍳","🐟","🥗","🧀","🍞","🥩","🍅"];

  return (
    <div style={{ minHeight: "calc(100vh - 52px)", background: "#F7F5F0", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
      `}</style>

      {/* Header */}
      <div style={{ background: "#1E5C3A", padding: "20px 16px 24px", color: "white" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>
          Bom dia! 👋 {paciente?.nome?.split(" ")[0] || ""}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Meu prato de hoje</div>
        <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Registrado hoje</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                {totalConfirmado}<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}> kcal</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Meta diária</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                {meta}<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}> kcal</span>
              </div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, background: "#7DFCA8", height: "100%", borderRadius: 99, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 5 }}>{pct}% da meta atingida</div>
        </div>
      </div>

      <div style={{ padding: "16px" }}>

        {/* Upload */}
        {!confirmando && (
          <>
            <div
              onClick={() => !imagem && fileRef.current.click()}
              onDrop={e => { e.preventDefault(); handleArquivo(e.dataTransfer.files[0]); }}
              onDragOver={e => e.preventDefault()}
              style={{ border: imagem ? "none" : "2px dashed #C8E6D4", borderRadius: 20, overflow: "hidden", background: imagem ? "transparent" : "white", minHeight: imagem ? "auto" : 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: imagem ? "default" : "pointer", marginBottom: 12 }}
            >
              {imagem ? (
                <img src={imagem} alt="prato" style={{ width: "100%", borderRadius: 20, maxHeight: 320, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ textAlign: "center", padding: "32px 16px" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                  <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 16, marginBottom: 4 }}>Fotografar meu prato</div>
                  <div style={{ fontSize: 13, color: "#aaa" }}>Toque aqui para abrir a câmera</div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={e => handleArquivo(e.target.files[0])} />
            </div>

            {imagem && status !== "analisando" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button onClick={reset} style={{ flex: 1, background: "white", border: "1px solid #E8E8E0", borderRadius: 12, padding: 12, fontSize: 13, color: "#666", cursor: "pointer" }}>
                  🔄 Trocar foto
                </button>
                <button onClick={analisar} style={{ flex: 2, background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  🔍 Analisar com IA
                </button>
              </div>
            )}

            {!imagem && (
              <button onClick={() => fileRef.current.click()} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 14, padding: 16, fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
                📷 Fotografar meu prato
              </button>
            )}
          </>
        )}

        {/* Loading */}
        {(status === "analisando" || status === "salvando") && (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 10, animation: "spin 1s linear infinite", display: "inline-block" }}>🔄</div>
            <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 15 }}>
              {status === "analisando" ? "Analisando o prato com IA..." : "Salvando e enviando..."}
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
              {status === "analisando" ? "Identificando alimentos com alta precisão" : "Guardando foto e dados para a nutricionista"}
            </div>
          </div>
        )}

        {/* Erro */}
        {status === "erro" && (
          <div style={{ background: "#FFF0F0", border: "1px solid #FFD0D0", borderRadius: 14, padding: 14, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, color: "#C00", marginBottom: 4 }}>⚠️ Erro</div>
            <div style={{ fontSize: 12, color: "#888" }}>{erro}</div>
            <button onClick={analisar} style={{ marginTop: 10, background: "#1E5C3A", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Tentar novamente
            </button>
          </div>
        )}

        {/* TELA DE CONFIRMAÇÃO */}
        {confirmando && resultado && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* Foto miniatura */}
            {imagem && (
              <img src={imagem} alt="prato" style={{ width: "100%", borderRadius: 16, maxHeight: 200, objectFit: "cover", marginBottom: 12 }} />
            )}

            {/* Precisão geral */}
            <div style={{
              background: precisaoGeral >= 85 ? "#EEF7F2" : precisaoGeral >= 70 ? "#FAEEDA" : "#FCEBEB",
              border: `1px solid ${precisaoGeral >= 85 ? "#C8E6D4" : precisaoGeral >= 70 ? "#F0D9A0" : "#FFD0D0"}`,
              borderRadius: 12, padding: "10px 14px", marginBottom: 12,
              display: "flex", alignItems: "center", gap: 10
            }}>
              <div style={{ fontSize: 22 }}>
                {precisaoGeral >= 85 ? "🎯" : precisaoGeral >= 70 ? "⚠️" : "❓"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: precisaoGeral >= 85 ? "#0F6E56" : precisaoGeral >= 70 ? "#633806" : "#791F1F" }}>
                  Precisão geral da análise: {precisaoGeral}%
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
                  {precisaoGeral >= 85 ? "Boa precisão — confirme e envie!" : precisaoGeral >= 70 ? "Verifique os itens marcados com ⚠️" : "Confira todos os alimentos antes de enviar"}
                </div>
              </div>
            </div>

            {/* Label */}
            <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              ✏️ Confirme ou corrija os alimentos
            </div>

            {/* Lista editável */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {alimentosEdit.map((a, i) => (
                <div key={i} style={{ background: "white", borderRadius: 14, padding: "11px 14px", border: `1px solid ${a.confianca < 70 ? "#FFD0D0" : a.confianca < 85 ? "#F0D9A0" : "#F0EFE8"}`, animation: `fadeUp 0.4s ease ${i * 0.05}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, background: "#EEF7F2", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                      {emojis[i % emojis.length]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {a.editando ? (
                        <input
                          value={a.nome}
                          onChange={e => atualizarAlimento(i, "nome", e.target.value)}
                          onBlur={() => atualizarAlimento(i, "editando", false)}
                          autoFocus
                          style={{ width: "100%", border: "1px solid #1E5C3A", borderRadius: 6, padding: "4px 8px", fontSize: 13, fontWeight: 700, outline: "none" }}
                        />
                      ) : (
                        <div
                          onClick={() => atualizarAlimento(i, "editando", true)}
                          style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", cursor: "text", display: "flex", alignItems: "center", gap: 4 }}
                        >
                          {a.nome} <span style={{ fontSize: 11, color: "#1E5C3A" }}>✏️</span>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: "#aaa" }}>{a.porcao} · {a.peso_estimado_g}g</span>
                        <input
                          type="number"
                          value={a.calorias}
                          onChange={e => atualizarAlimento(i, "calorias", Number(e.target.value))}
                          style={{ width: 55, border: "1px solid #E8E8E0", borderRadius: 6, padding: "2px 6px", fontSize: 12, outline: "none", color: "#1E5C3A", fontWeight: 700 }}
                        />
                        <span style={{ fontSize: 11, color: "#aaa" }}>kcal</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                      <ConfidenceBadge confianca={a.confianca} alternativa={a.alternativa} />
                      <button
                        onClick={() => removerAlimento(i)}
                        style={{ background: "#FCEBEB", color: "#E24B4A", border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
                      >
                        ✕ Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total confirmado */}
            <div style={{ background: "#1E5C3A", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, color: "white" }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Total confirmado</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{totalConfirmado} <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}>kcal</span></div>
            </div>

            {/* Observação */}
            {resultado.observacao && (
              <div style={{ background: "#EEF7F2", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 8, marginBottom: 12 }}>
                <span>💡</span>
                <div style={{ fontSize: 13, color: "#1E5C3A", lineHeight: 1.5 }}>{resultado.observacao}</div>
              </div>
            )}

            {/* Botões */}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={reset} style={{ flex: 1, background: "white", border: "1px solid #E8E8E0", borderRadius: 12, padding: 12, fontSize: 13, color: "#666", cursor: "pointer" }}>
                🔄 Nova foto
              </button>
              <button onClick={confirmarEEnviar} style={{ flex: 2, background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                ✅ Confirmar e enviar
              </button>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {enviado && (
          <div style={{ background: "#EEF7F2", border: "1px solid #C8E6D4", borderRadius: 14, padding: 20, textAlign: "center", animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 16 }}>Refeição confirmada e enviada!</div>
            <div style={{ fontSize: 12, color: "#4CAF82", marginTop: 4 }}>A nutricionista já pode ver sua refeição com a foto</div>
            <button onClick={reset} style={{ marginTop: 14, background: "transparent", border: "1px solid #C8E6D4", borderRadius: 8, padding: "8px 20px", fontSize: 13, color: "#1E5C3A", cursor: "pointer", fontWeight: 600 }}>
              Registrar outra refeição
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
