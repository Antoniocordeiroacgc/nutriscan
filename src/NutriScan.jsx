import { useState, useRef, useCallback } from "react";
import { salvarRefeicao } from "./lib/supabase";


async function analisarComIA(base64Data, mediaType) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: `Você é um especialista em nutrição brasileiro. Analise a foto do prato e identifique todos os alimentos visíveis.
Responda SOMENTE com JSON válido, sem markdown, sem texto extra:
{
  "refeicao": "nome descritivo da refeição",
  "alimentos": [
    {
      "nome": "nome do alimento em português",
      "peso_estimado_g": número inteiro,
      "calorias": número inteiro,
      "porcao": "descrição da porção ex: 4 colheres, 1 concha, 100g"
    }
  ],
  "total_calorias": número inteiro,
  "observacao": "comentário nutricional breve em português"
}`,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Data }
          },
          {
            type: "text",
            text: "Analise este prato e retorne o JSON nutricional completo."
          }
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
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

export default function NutriScan({ paciente }) {
  const PACIENTE_ID = paciente?.id || "00000000-0000-0000-0000-000000000001";
  const [imagem, setImagem] = useState(null);
  const [base64, setBase64] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [status, setStatus] = useState("idle");
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [enviado, setEnviado] = useState(false);
  const fileRef = useRef();

  const handleArquivo = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setFotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setImagem(dataUrl);
      setBase64(dataUrl.split(",")[1]);
      setMediaType(file.type);
      setStatus("idle");
      setResultado(null);
      setEnviado(false);
      setErro("");
    };
    reader.readAsDataURL(file);
  }, []);

  const analisar = async () => {
    if (!base64) return;
    setStatus("analisando");
    setErro("");
    setResultado(null);
    try {
      const analise = await analisarComIA(base64, mediaType);
      setResultado(analise);
      setStatus("pronto");
    } catch (e) {
      setErro(e.message);
      setStatus("erro");
    }
  };

  const enviarParaNutricionista = async () => {
    if (!resultado || !fotoFile) return;
    setStatus("salvando");
    try {
      await salvarRefeicao(PACIENTE_ID, fotoFile, resultado);
      setEnviado(true);
      setStatus("salvo");
    } catch (e) {
      setErro("Erro ao salvar: " + e.message);
      setStatus("erro");
    }
  };

  const total = resultado?.total_calorias || 0;
  const meta = 1850;
  const pct = Math.min(100, Math.round((total / meta) * 100));

  const emojis = ["🍚","🫘","🥦","🍗","🥕","🍳","🐟","🥗","🧀","🍞","🥩","🍅"];

  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "#F7F5F0",
      fontFamily: "system-ui, sans-serif"
    }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
      `}</style>

      {/* Header verde */}
      <div style={{
        background: "#1E5C3A",
        padding: "20px 16px 24px",
        color: "white"
      }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Bom dia! 👋</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Meu prato de hoje</div>

        <div style={{
          background: "rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: "12px 16px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Registrado hoje</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                {total}
                <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}> kcal</span>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>Meta diária</div>
              <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
                {meta}
                <span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}> kcal</span>
              </div>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 99, height: 6, overflow: "hidden" }}>
            <div style={{
              width: `${pct}%`, background: "#7DFCA8",
              height: "100%", borderRadius: 99,
              transition: "width 0.8s ease"
            }} />
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 5 }}>
            {pct}% da meta atingida
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "16px" }}>

        {/* Área de upload/câmera */}
        <div
          onClick={() => !imagem && fileRef.current.click()}
          onDrop={e => { e.preventDefault(); handleArquivo(e.dataTransfer.files[0]); }}
          onDragOver={e => e.preventDefault()}
          style={{
            border: imagem ? "none" : "2px dashed #C8E6D4",
            borderRadius: 20,
            overflow: "hidden",
            background: imagem ? "transparent" : "white",
            minHeight: imagem ? "auto" : 200,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: imagem ? "default" : "pointer",
            marginBottom: 12,
            transition: "all 0.2s"
          }}
        >
          {imagem ? (
            <img
              src={imagem}
              alt="prato"
              style={{
                width: "100%", borderRadius: 20,
                maxHeight: 320, objectFit: "cover", display: "block"
              }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
              <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 16, marginBottom: 4 }}>
                Fotografar meu prato
              </div>
              <div style={{ fontSize: 13, color: "#aaa" }}>
                Toque aqui para abrir a câmera
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            onChange={e => handleArquivo(e.target.files[0])}
          />
        </div>

        {/* Botões de ação */}
        {imagem && status !== "analisando" && status !== "salvando" && (
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => {
                setImagem(null); setBase64(null); setFotoFile(null);
                setResultado(null); setStatus("idle"); setEnviado(false); setErro("");
              }}
              style={{
                flex: 1, background: "white",
                border: "1px solid #E8E8E0", borderRadius: 12,
                padding: "12px", fontSize: 13, color: "#666",
                cursor: "pointer", fontWeight: 500
              }}
            >
              🔄 Trocar foto
            </button>
            {!resultado && (
              <button
                onClick={analisar}
                style={{
                  flex: 2, background: "#1E5C3A", color: "white",
                  border: "none", borderRadius: 12, padding: "12px 16px",
                  fontSize: 14, fontWeight: 700, cursor: "pointer"
                }}
              >
                🔍 Analisar com IA
              </button>
            )}
          </div>
        )}

        {/* Botão câmera inicial */}
        {!imagem && (
          <button
            onClick={() => fileRef.current.click()}
            style={{
              width: "100%", background: "#1E5C3A", color: "white",
              border: "none", borderRadius: 14, padding: 16,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", gap: 8, marginBottom: 12
            }}
          >
            📷 Fotografar meu prato
          </button>
        )}

        {/* Loading */}
        {(status === "analisando" || status === "salvando") && (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{
              fontSize: 36, marginBottom: 10,
              animation: "spin 1s linear infinite",
              display: "inline-block"
            }}>🔄</div>
            <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 15 }}>
              {status === "analisando"
                ? "Analisando o prato com IA..."
                : "Enviando para a nutricionista..."}
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>
              {status === "analisando"
                ? "Identificando alimentos e calculando calorias"
                : "Salvando foto e dados no banco"}
            </div>
          </div>
        )}

        {/* Erro */}
        {status === "erro" && (
          <div style={{
            background: "#FFF0F0", border: "1px solid #FFD0D0",
            borderRadius: 14, padding: 14, marginBottom: 16
          }}>
            <div style={{ fontWeight: 700, color: "#C00", marginBottom: 4 }}>
              ⚠️ Erro na análise
            </div>
            <div style={{ fontSize: 12, color: "#888" }}>{erro}</div>
            <button
              onClick={analisar}
              style={{
                marginTop: 10, background: "#1E5C3A", color: "white",
                border: "none", borderRadius: 8, padding: "8px 16px",
                fontSize: 12, fontWeight: 700, cursor: "pointer"
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Resultado da análise */}
        {resultado && status !== "analisando" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* Card total */}
            <div style={{
              background: "#1E5C3A", borderRadius: 18,
              padding: "16px 18px", marginBottom: 12, color: "white"
            }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
                Refeição identificada
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 12 }}>
                {resultado.refeicao}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{total}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>kcal nesta refeição</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{pct}% da meta</div>
                  <div style={{
                    background: "rgba(255,255,255,0.2)", borderRadius: 99,
                    height: 6, width: 100, marginTop: 6, overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${pct}%`, background: "#7DFCA8",
                      height: "100%", borderRadius: 99
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de alimentos */}
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#888",
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 8
            }}>
              Alimentos detectados pela IA
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {resultado.alimentos.map((a, i) => (
                <div key={i} style={{
                  background: "white", borderRadius: 14,
                  padding: "11px 14px", display: "flex",
                  alignItems: "center", gap: 12,
                  border: "1px solid #F0EFE8",
                  animation: `fadeUp 0.4s ease ${i * 0.07}s both`
                }}>
                  <div style={{
                    width: 44, height: 44, background: "#EEF7F2",
                    borderRadius: 11, display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: 22, flexShrink: 0
                  }}>
                    {emojis[i % emojis.length]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{a.nome}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>
                      {a.porcao} · {a.peso_estimado_g}g
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#1E5C3A" }}>{a.calorias}</div>
                    <div style={{ fontSize: 10, color: "#aaa" }}>kcal</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Observação nutricional */}
            {resultado.observacao && (
              <div style={{
                background: "#EEF7F2", borderRadius: 13,
                padding: "11px 14px", display: "flex",
                gap: 8, marginBottom: 12, alignItems: "flex-start"
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                <div style={{ fontSize: 13, color: "#1E5C3A", lineHeight: 1.5 }}>
                  {resultado.observacao}
                </div>
              </div>
            )}

            {/* Botão enviar / confirmação */}
            {!enviado ? (
              <button
                onClick={enviarParaNutricionista}
                disabled={status === "salvando"}
                style={{
                  width: "100%", background: "#1E5C3A", color: "white",
                  border: "none", borderRadius: 14, padding: 14,
                  fontSize: 15, fontWeight: 700, cursor: "pointer",
                  marginBottom: 8, opacity: status === "salvando" ? 0.7 : 1
                }}
              >
                📤 Enviar para a nutricionista
              </button>
            ) : (
              <div style={{
                background: "#EEF7F2", border: "1px solid #C8E6D4",
                borderRadius: 14, padding: 16, textAlign: "center",
                animation: "fadeUp 0.4s ease"
              }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 15 }}>
                  Enviado com sucesso!
                </div>
                <div style={{ fontSize: 12, color: "#4CAF82", marginTop: 4 }}>
                  A nutricionista já pode ver sua refeição
                </div>
                <button
                  onClick={() => {
                    setImagem(null); setBase64(null); setFotoFile(null);
                    setResultado(null); setStatus("idle"); setEnviado(false);
                  }}
                  style={{
                    marginTop: 12, background: "transparent",
                    border: "1px solid #C8E6D4", borderRadius: 8,
                    padding: "8px 20px", fontSize: 13, color: "#1E5C3A",
                    cursor: "pointer", fontWeight: 600
                  }}
                >
                  Registrar outra refeição
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
