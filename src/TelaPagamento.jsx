import { useState, useEffect, useRef } from "react";
import { supabase } from "./lib/supabase";

const VALOR_PLANO = 34.90;

export default function TelaPagamento({ pacienteId, nome, email, onConcluido, onVoltar }) {
  const [forma, setForma] = useState("pix");
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [cobranca, setCobranca] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const pollingRef = useRef();

  // Verifica periodicamente se o pagamento foi confirmado (via webhook atualizando o banco)
  useEffect(() => {
    if (cobranca && forma === "pix") {
      pollingRef.current = setInterval(async () => {
        const { data } = await supabase.from("pacientes").select("pago").eq("id", pacienteId).maybeSingle();
        if (data?.pago) {
          clearInterval(pollingRef.current);
          onConcluido?.();
        }
      }, 4000);
    }
    return () => clearInterval(pollingRef.current);
  }, [cobranca]);

  const criarCobranca = async () => {
    if (forma === "pix" && (!cpf || cpf.replace(/\D/g, "").length < 11)) {
      setErro("Informe um CPF válido."); return;
    }
    setLoading(true); setErro("");
    try {
      const response = await fetch("/api/criar-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, email,
          cpf: cpf.replace(/\D/g, ""),
          forma, valor: VALOR_PLANO,
          pacienteId,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao criar cobrança");

      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
        return;
      }
      setCobranca(data);
    } catch (e) {
      setErro(e.message);
    }
    setLoading(false);
  };

  const copiarPix = () => {
    if (cobranca?.qrCode?.payload) {
      navigator.clipboard.writeText(cobranca.qrCode.payload);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  };

  const formatarCpf = (val) => {
    const n = val.replace(/\D/g, "").slice(0, 11);
    return n.replace(/(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_, a, b, c, d) =>
      [a, b, c, d].filter(Boolean).join(".").replace(/\.(\d{2})$/, "-$1")
    );
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>

      <div style={{ background: "#1E5C3A", borderRadius: 14, padding: "16px 18px", marginBottom: 16, color: "white" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>Plano Anual NutriScan</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>R$ {VALOR_PLANO.toFixed(2).replace(".", ",")}<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(255,255,255,0.6)" }}> /ano</span></div>
        <div style={{ fontSize: 11, color: "#7DFCA8", marginTop: 4 }}>✓ Análise de pratos por IA · ✓ 591 alimentos TACO · ✓ Acompanhamento nutricional</div>
      </div>

      {!cobranca ? (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Forma de pagamento
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button onClick={() => setForma("pix")} style={{
              flex: 1, background: forma === "pix" ? "#EEF7F2" : "white",
              border: forma === "pix" ? "2px solid #1E5C3A" : "1.5px solid #E8E8E0",
              borderRadius: 12, padding: "14px 10px", cursor: "pointer", textAlign: "center"
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>💠</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: forma === "pix" ? "#1E5C3A" : "#555" }}>Pix</div>
              <div style={{ fontSize: 10, color: "#aaa" }}>Aprovação imediata</div>
            </button>
            <button onClick={() => setForma("cartao")} style={{
              flex: 1, background: forma === "cartao" ? "#EEF7F2" : "white",
              border: forma === "cartao" ? "2px solid #1E5C3A" : "1.5px solid #E8E8E0",
              borderRadius: 12, padding: "14px 10px", cursor: "pointer", textAlign: "center"
            }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>💳</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: forma === "cartao" ? "#1E5C3A" : "#555" }}>Cartão</div>
              <div style={{ fontSize: 10, color: "#aaa" }}>Crédito</div>
            </button>
          </div>

          {forma === "pix" && (
            <input
              value={cpf}
              onChange={e => setCpf(formatarCpf(e.target.value))}
              placeholder="Seu CPF"
              maxLength={14}
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "12px 14px", fontSize: 14, marginBottom: 12, outline: "none", boxSizing: "border-box" }}
            />
          )}

          {erro && <div style={{ color: "#C00", fontSize: 12, marginBottom: 10 }}>{erro}</div>}

          <button onClick={criarCobranca} disabled={loading} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
            {loading ? "Processando..." : forma === "pix" ? "💠 Gerar Pix" : "💳 Pagar com cartão"}
          </button>
          <button onClick={onVoltar} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8 }}>← Voltar</button>
        </>
      ) : (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1E5C3A", marginBottom: 12 }}>
            📱 Escaneie o QR Code ou copie o código
          </div>
          {cobranca.qrCode?.encodedImage && (
            <img
              src={`data:image/png;base64,${cobranca.qrCode.encodedImage}`}
              alt="QR Code Pix"
              style={{ width: 220, height: 220, margin: "0 auto 16px", borderRadius: 12, border: "1px solid #F0EFE8" }}
            />
          )}
          <button onClick={copiarPix} style={{ width: "100%", background: copiado ? "#EEF7F2" : "#F7F5F0", color: copiado ? "#0F6E56" : "#555", border: "1px solid #E8E8E0", borderRadius: 10, padding: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>
            {copiado ? "✓ Código copiado!" : "📋 Copiar código Pix"}
          </button>
          <div style={{ background: "#FAEEDA", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#633806", lineHeight: 1.5 }}>
            ⏳ Aguardando confirmação automática... esta tela atualiza sozinha quando o pagamento for aprovado.
          </div>
        </div>
      )}
    </div>
  );
}
