import { useState } from "react";
import { supabase } from "./lib/supabase";

const SLIDES = [
  {
    icon: "📷",
    titulo: "Fotografe seu prato",
    texto: "Abra a câmera, aponte para o seu prato e tire uma foto. Funciona com qualquer refeição — almoço, jantar, lanche ou café da manhã!",
    cor: "#1E5C3A",
    dica: "💡 Dica: foto de cima e bem iluminada dá resultados mais precisos.",
  },
  {
    icon: "🤖",
    titulo: "IA analisa em segundos",
    texto: "Nossa inteligência artificial identifica automaticamente cada alimento do prato e calcula as calorias com base na Tabela TACO oficial.",
    cor: "#378ADD",
    dica: "📋 Temos 591 alimentos cadastrados da Tabela TACO — 4ª edição UNICAMP.",
  },
  {
    icon: "✏️",
    titulo: "Confirme e corrija",
    texto: "Antes de enviar, você vê todos os alimentos identificados com o percentual de confiança da IA. Se algo estiver errado, toque no nome e corrija — as calorias recalculam automaticamente!",
    cor: "#EF9F27",
    dica: "🎯 A IA mostra a precisão de cada alimento: ✓ 92% Arroz  ~ 78% Cenoura",
  },
  {
    icon: "👩‍⚕️",
    titulo: "Nutricionista acompanha tudo",
    texto: "Sua nutricionista cadastrada vê em tempo real todas as suas refeições, as fotos reais dos pratos, calorias e macronutrientes do dia.",
    cor: "#D4537E",
    dica: "📊 Ela pode filtrar por paciente, ver histórico e enviar observações.",
  },
  {
    icon: "📊",
    titulo: "Macronutrientes completos",
    texto: "Além das calorias, o NutriScan calcula proteínas, carboidratos, gorduras e fibras de cada refeição com base na tabela TACO oficial.",
    cor: "#7F77DD",
    dica: "💪 Proteínas  🍞 Carboidratos  🥑 Gorduras  🌾 Fibras",
  },
  {
    icon: "💬",
    titulo: "Nos dê seu feedback!",
    texto: "O NutriScan está em fase de testes e sua opinião é fundamental para melhorarmos. Diga o que achou — seja positivo ou negativo!",
    cor: "#1E5C3A",
    dica: null,
    feedback: true,
  },
];

export default function Tutorial({ paciente, onConcluir }) {
  const [slide, setSlide] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [tipoFeedback, setTipoFeedback] = useState(null); // "positivo" | "negativo"
  const [enviandoFeedback, setEnviandoFeedback] = useState(false);
  const [feedbackEnviado, setFeedbackEnviado] = useState(false);

  const atual = SLIDES[slide];
  const ultimo = slide === SLIDES.length - 1;
  const progresso = ((slide + 1) / SLIDES.length) * 100;

  const enviarFeedback = async () => {
    if (!tipoFeedback && !feedback.trim()) {
      onConcluir();
      return;
    }
    setEnviandoFeedback(true);
    try {
      await supabase.from("contatos").insert({
        nome: paciente?.nome || "Usuário",
        email: paciente?.email || "",
        celular: "",
        mensagem: `[FEEDBACK ${tipoFeedback?.toUpperCase() || ""}] ${feedback}`,
      });
      setFeedbackEnviado(true);
      setTimeout(() => onConcluir(), 2000);
    } catch {
      onConcluir();
    }
    setEnviandoFeedback(false);
  };

  const avancar = () => {
    if (ultimo) {
      enviarFeedback();
    } else {
      setSlide(s => s + 1);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "system-ui, sans-serif"
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
      `}</style>

      <div style={{
        background: "white", borderRadius: 24, width: "100%", maxWidth: 420,
        overflow: "hidden", animation: "fadeUp 0.4s ease"
      }}>

        {/* Barra de progresso */}
        <div style={{ height: 4, background: "#F0EFE8" }}>
          <div style={{ height: "100%", background: atual.cor, width: `${progresso}%`, transition: "width 0.4s ease" }} />
        </div>

        {/* Header colorido */}
        <div style={{ background: atual.cor, padding: "28px 24px 20px", textAlign: "center", transition: "background 0.4s ease" }}>
          <div style={{ fontSize: 56, marginBottom: 8, animation: "pulse 2s infinite" }}>{atual.icon}</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: "white", marginBottom: 4 }}>{atual.titulo}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>
            {slide + 1} de {SLIDES.length}
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: "20px 24px 24px" }}>
          <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 14, textAlign: "center" }}>
            {atual.texto}
          </div>

          {/* Dica */}
          {atual.dica && (
            <div style={{ background: "#F7F5F0", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#666", textAlign: "center", lineHeight: 1.5 }}>
              {atual.dica}
            </div>
          )}

          {/* Feedback */}
          {atual.feedback && !feedbackEnviado && (
            <div style={{ marginBottom: 16 }}>
              {/* Botões positivo/negativo */}
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button
                  onClick={() => setTipoFeedback("positivo")}
                  style={{
                    flex: 1, padding: "12px 8px", borderRadius: 12, border: "2px solid",
                    borderColor: tipoFeedback === "positivo" ? "#1E5C3A" : "#E8E8E0",
                    background: tipoFeedback === "positivo" ? "#EEF7F2" : "white",
                    cursor: "pointer", fontSize: 14, fontWeight: 700,
                    color: tipoFeedback === "positivo" ? "#1E5C3A" : "#888",
                    transition: "all 0.2s"
                  }}
                >
                  👍 Gostei!
                </button>
                <button
                  onClick={() => setTipoFeedback("negativo")}
                  style={{
                    flex: 1, padding: "12px 8px", borderRadius: 12, border: "2px solid",
                    borderColor: tipoFeedback === "negativo" ? "#E24B4A" : "#E8E8E0",
                    background: tipoFeedback === "negativo" ? "#FCEBEB" : "white",
                    cursor: "pointer", fontSize: 14, fontWeight: 700,
                    color: tipoFeedback === "negativo" ? "#E24B4A" : "#888",
                    transition: "all 0.2s"
                  }}
                >
                  👎 Melhorar
                </button>
              </div>

              {/* Campo de texto */}
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder={tipoFeedback === "negativo"
                  ? "O que podemos melhorar? Sua opinião é muito importante!"
                  : tipoFeedback === "positivo"
                  ? "O que mais gostou? Pode elogiar à vontade! 😊"
                  : "Escreva sua opinião sobre o NutriScan..."}
                rows={3}
                style={{
                  width: "100%", border: "1px solid #E8E8E0", borderRadius: 10,
                  padding: "10px 12px", fontSize: 13, outline: "none",
                  boxSizing: "border-box", resize: "none",
                  fontFamily: "system-ui, sans-serif", color: "#333"
                }}
              />
            </div>
          )}

          {feedbackEnviado && (
            <div style={{ textAlign: "center", padding: "12px 0", marginBottom: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 6 }}>🙏</div>
              <div style={{ fontWeight: 700, color: "#1E5C3A", fontSize: 15 }}>Obrigado pelo feedback!</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>Sua opinião nos ajuda a melhorar.</div>
            </div>
          )}

          {/* Dots de navegação */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 16 }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width: i === slide ? 20 : 8, height: 8, borderRadius: 99,
                  background: i === slide ? atual.cor : "#E0E0E0",
                  cursor: "pointer", transition: "all 0.3s ease"
                }}
              />
            ))}
          </div>

          {/* Botões navegação */}
          <div style={{ display: "flex", gap: 8 }}>
            {slide > 0 && (
              <button
                onClick={() => setSlide(s => s - 1)}
                style={{ flex: 1, background: "white", border: "1px solid #E8E8E0", borderRadius: 12, padding: 12, fontSize: 13, color: "#666", cursor: "pointer" }}
              >
                ← Voltar
              </button>
            )}
            <button
              onClick={avancar}
              disabled={enviandoFeedback}
              style={{
                flex: 2, background: atual.cor, color: "white", border: "none",
                borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700,
                cursor: "pointer", transition: "background 0.3s"
              }}
            >
              {ultimo
                ? (enviandoFeedback ? "Enviando..." : feedbackEnviado ? "Entrando..." : "🚀 Começar a usar!")
                : "Próximo →"}
            </button>
          </div>

          {/* Pular */}
          {!ultimo && (
            <button
              onClick={onConcluir}
              style={{ width: "100%", background: "transparent", border: "none", color: "#bbb", fontSize: 12, cursor: "pointer", marginTop: 8, padding: 4 }}
            >
              Pular tutorial
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
