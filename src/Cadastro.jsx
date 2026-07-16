import { useState } from "react";
import { supabase } from "./lib/supabase";
import Rodape from "./Rodape";
import TelaPagamento from "./TelaPagamento";

const OBJETIVOS = [
  { id: "emagrecimento", label: "⚖️ Emagrecimento", desc: "Perder gordura preservando músculo" },
  { id: "ganho_massa", label: "💪 Ganho de massa", desc: "Aumentar massa muscular" },
  { id: "saude_geral", label: "🌱 Saúde geral", desc: "Manter saúde e equilíbrio" },
];

function calcularMetas(peso, objetivo) {
  const p = Number(peso);
  if (!p || p <= 0) return null;

  if (objetivo === "ganho_massa") {
    return {
      calorias: Math.round(p * 35),
      proteinas: Math.round(p * 1.6),
      carboidratos: Math.round(p * 4),
      gorduras: Math.round(p * 0.7),
      creatina: Math.round(p * 0.07 * 10) / 10,
      agua: Math.round(p * 35),
      fibras: null,
    };
  }

  if (objetivo === "emagrecimento") {
    return {
      calorias: Math.round(p * 20),
      proteinas: Math.round(p * 2),
      carboidratos: Math.round(p * 2),
      gorduras: Math.round(p * 0.8),
      fibras: Math.round(p * 0.5),
      agua: Math.round(p * 35),
      creatina: null,
    };
  }

  // Saúde geral — média entre os dois
  return {
    calorias: Math.round(p * 27),
    proteinas: Math.round(p * 1.8),
    carboidratos: Math.round(p * 3),
    gorduras: Math.round(p * 0.75),
    fibras: Math.round(p * 0.4),
    agua: Math.round(p * 35),
    creatina: null,
  };
}

function CardMeta({ icon, label, val, unit, color, bg }) {
  return (
    <div style={{ background: bg || "#F7F5F0", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: "#aaa" }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: color || "#1a1a1a" }}>{val} <span style={{ fontSize: 11, fontWeight: 400, color: "#aaa" }}>{unit}</span></div>
      </div>
    </div>
  );
}

export default function Cadastro({ onCadastrado }) {
  const [etapa, setEtapa] = useState("inicio");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [objetivo, setObjetivo] = useState("");
  const [peso, setPeso] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [pacienteTemp, setPacienteTemp] = useState(null);

  // Fale conosco
  const [cNome, setCNome] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cCelular, setCCelular] = useState("");
  const [cMensagem, setCMensagem] = useState("");
  const [cLoading, setCLoading] = useState(false);
  const [cErro, setCErro] = useState("");

  const metas = calcularMetas(peso, objetivo);

  const cadastrar = async () => {
    if (!nome || !email || !senha || !objetivo || !peso) {
      setErro("Preencha todos os campos."); return;
    }
    setLoading(true); setErro("");
    try {
      const obj = OBJETIVOS.find(o => o.id === objetivo);
      const response = await fetch("/api/cadastrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, email, senha,
          objetivo: obj.label,
          meta_kcal: metas?.calorias,
          meta_proteina: metas?.proteinas,
          meta_carb: metas?.carboidratos,
          meta_gordura: metas?.gorduras,
          meta_fibra: metas?.fibras,
          meta_agua: metas?.agua,
          peso_kg: Number(peso),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPacienteTemp(data);
      setEtapa("pagamento");
    } catch (e) {
      setErro(e.message);
    }
    setLoading(false);
  };

  const entrar = async () => {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setLoading(true); setErro("");
    try {
      const response = await fetch("/api/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onCadastrado(data);
    } catch (e) { setErro(e.message); }
    setLoading(false);
  };

  const enviarContato = async () => {
    if (!cNome || !cEmail || !cMensagem) { setCErro("Preencha nome, e-mail e mensagem."); return; }
    setCLoading(true); setCErro("");
    try {
      const { error } = await supabase.from("contatos").insert({ nome: cNome, email: cEmail, celular: cCelular, mensagem: cMensagem });
      if (error) throw error;
      setEtapa("contato_ok");
    } catch (e) { setCErro(e.message); }
    setCLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}.card{animation:fadeUp 0.4s ease}`}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 48, marginBottom: 6 }}>🥗</div>
        <div style={{ fontWeight: 800, fontSize: 26, color: "#1E5C3A" }}>NutriScan</div>
        <div style={{ fontSize: 11, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase" }}>CRIAR.IA TECNOLOGIA</div>
      </div>

            <div className="card" style={{ background: "white", borderRadius: 20, padding: 24, width: "100%", maxWidth: 400, border: "1px solid #F0EFE8" }}>

        {/* INÍCIO */}
        {etapa === "inicio" && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginBottom: 6 }}>Bem-vindo ao NutriScan! 👋</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.6 }}>Fotografe seus pratos e receba análise calórica por IA. Sua nutricionista acompanha tudo em tempo real.</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {[["🤖", "IA identifica alimentos automaticamente"], ["📊", "Calorias e macros pela Tabela TACO"], ["👩‍⚕️", "Nutricionista acompanha seu progresso"], ["📱", "Funciona no celular pela câmera"]].map(([icon, text], i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: "#555" }}>{text}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setEtapa("dados")} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>Criar conta  →</button>
            <button onClick={() => { setEtapa("login"); setErro(""); }} style={{ width: "100%", background: "transparent", color: "#666", border: "1px solid #E8E8E0", borderRadius: 12, padding: 12, fontSize: 13, cursor: "pointer", marginBottom: 8 }}>Já tenho conta — Entrar</button>
            <button onClick={() => setEtapa("contato")} style={{ width: "100%", background: "transparent", color: "#1E5C3A", border: "1px solid #C8E6D4", borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>💬 Fale Conosco</button>
          </div>
        )}

        {/* LOGIN */}
        {etapa === "login" && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginBottom: 20 }}>Entrar na sua conta</div>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" type="email"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" type={mostrarSenha ? "text" : "password"}
                style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 40px 10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              <button onClick={() => setMostrarSenha(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
                {mostrarSenha ? "🙈" : "👁️"}
              </button>
            </div>
            {erro && <div style={{ color: "#C00", fontSize: 12, marginBottom: 12 }}>{erro}</div>}
            <button onClick={entrar} disabled={loading} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <button onClick={() => { setEtapa("inicio"); setErro(""); }} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8 }}>← Voltar</button>
          </div>
        )}

        {/* DADOS */}
        {etapa === "dados" && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 4 }}>Seus dados</div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 20 }}>Etapa 1 de 3</div>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu melhor e-mail" type="email"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
            <div style={{ position: "relative", marginBottom: 10 }}>
              <input value={senha} onChange={e => setSenha(e.target.value)} placeholder="Crie uma senha" type={mostrarSenha ? "text" : "password"}
                style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 40px 10px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              <button onClick={() => setMostrarSenha(p => !p)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 16 }}>
                {mostrarSenha ? "🙈" : "👁️"}
              </button>
            </div>
            {erro && <div style={{ color: "#C00", fontSize: 12, marginBottom: 10 }}>{erro}</div>}
            <button onClick={() => {
              const n = nome.trim(), e = email.trim(), s = senha.trim();
              if (!n || !e || !s) { setErro("Preencha todos os campos."); return; }
              setErro(""); setEtapa("objetivo");
            }} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Continuar →</button>
            <button onClick={() => { setEtapa("inicio"); setErro(""); }} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8, marginTop: 4 }}>← Voltar</button>
          </div>
        )}

        {/* OBJETIVO */}
        {etapa === "objetivo" && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 4 }}>Qual é o seu objetivo?</div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 20 }}>Etapa 2 de 3</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {OBJETIVOS.map(o => (
                <button key={o.id} onClick={() => setObjetivo(o.id)} style={{ background: objetivo === o.id ? "#EEF7F2" : "white", border: objetivo === o.id ? "2px solid #1E5C3A" : "1.5px solid #E8E8E0", borderRadius: 12, padding: "14px 16px", fontSize: 15, fontWeight: objetivo === o.id ? 700 : 500, color: objetivo === o.id ? "#1E5C3A" : "#555", cursor: "pointer", textAlign: "left" }}>
                  {o.label}
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 400, marginTop: 2 }}>{o.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => { if (!objetivo) { setErro("Escolha um objetivo."); return; } setErro(""); setEtapa("peso"); }}
              style={{ width: "100%", background: objetivo ? "#1E5C3A" : "#ccc", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: objetivo ? "pointer" : "not-allowed" }}>
              Continuar →
            </button>
            {erro && <div style={{ color: "#C00", fontSize: 12, marginTop: 8 }}>{erro}</div>}
            <button onClick={() => setEtapa("dados")} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8, marginTop: 4 }}>← Voltar</button>
          </div>
        )}

        {/* PESO */}
        {etapa === "peso" && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 4 }}>Qual é o seu peso?</div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 20 }}>Etapa 3 de 3 — Usaremos para calcular suas metas</div>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <input
                value={peso} onChange={e => setPeso(e.target.value)}
                placeholder="Ex: 75"
                type="number" min="30" max="250"
                style={{ flex: 1, border: "2px solid #1E5C3A", borderRadius: 10, padding: "14px 12px", fontSize: 22, fontWeight: 700, outline: "none", textAlign: "center", color: "#1E5C3A" }}
              />
              <div style={{ fontSize: 18, fontWeight: 700, color: "#aaa" }}>kg</div>
            </div>

            {/* Preview das metas */}
            {metas && peso >= 30 && (
              <div style={{ marginBottom: 16, animation: "fadeUp 0.3s ease" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                  📊 Suas metas personalizadas
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <CardMeta icon="🔥" label="Calorias/dia" val={metas.calorias} unit="kcal" color="#1E5C3A" bg="#EEF7F2" />
                  <CardMeta icon="💪" label="Proteínas" val={metas.proteinas} unit="g" color="#378ADD" bg="#E6F1FB" />
                  <CardMeta icon="🍞" label="Carboidratos" val={metas.carboidratos} unit="g" color="#EF9F27" bg="#FAEEDA" />
                  <CardMeta icon="🥑" label="Gorduras" val={metas.gorduras} unit="g" color="#E24B4A" bg="#FCEBEB" />
                  {metas.fibras && <CardMeta icon="🌾" label="Fibras" val={metas.fibras} unit="g" color="#4CAF82" bg="#EEF7F2" />}
                  {metas.creatina && <CardMeta icon="💊" label="Creatina" val={metas.creatina} unit="g" color="#7F77DD" bg="#EEEDFE" />}
                  <CardMeta icon="💧" label="Água/dia" val={metas.agua} unit="ml" color="#378ADD" bg="#E6F1FB" />
                </div>
                <div style={{ fontSize: 10, color: "#aaa", marginTop: 8, textAlign: "center" }}>
                  Calculado com base no seu peso e objetivo
                </div>
              </div>
            )}

            {erro && <div style={{ color: "#C00", fontSize: 12, marginBottom: 10 }}>{erro}</div>}
            <button onClick={cadastrar} disabled={loading || !peso}
              style={{ width: "100%", background: peso ? "#1E5C3A" : "#ccc", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: peso ? "pointer" : "not-allowed" }}>
              {loading ? "Criando conta..." : "🚀 Começar agora — grátis!"}
            </button>
            <button onClick={() => setEtapa("objetivo")} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8, marginTop: 4 }}>← Voltar</button>
          </div>
        )}

        {/* SUCESSO */}
        {etapa === "pagamento" && pacienteTemp && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 4 }}>Finalizar cadastro</div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 20 }}>Escolha a forma de pagamento</div>
            <TelaPagamento
              pacienteId={pacienteTemp.id}
              nome={pacienteTemp.nome}
              email={pacienteTemp.email}
              onConcluido={() => {
                setEtapa("sucesso");
                setTimeout(() => onCadastrado(pacienteTemp), 2500);
              }}
              onVoltar={() => setEtapa("peso")}
            />
          </div>
        )}


        {etapa === "sucesso" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1E5C3A", marginBottom: 8 }}>Conta criada com sucesso!</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              Suas metas foram calculadas com base no seu peso e objetivo.<br />
              Seu período de <strong>30 dias grátis</strong> começou agora!
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: "#aaa" }}>Entrando no app...</div>
          </div>
        )}

        {/* FALE CONOSCO */}
        {etapa === "contato" && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginBottom: 4 }}>💬 Fale Conosco</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.6 }}>Tem interesse no NutriScan? Deixe seu contato e retornaremos em breve!</div>
            <input value={cNome} onChange={e => setCNome(e.target.value)} placeholder="Seu nome completo"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
            <input value={cEmail} onChange={e => setCEmail(e.target.value)} placeholder="Seu e-mail" type="email"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
            <input value={cCelular} onChange={e => setCCelular(e.target.value)} placeholder="WhatsApp / Celular (opcional)"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }} />
            <textarea value={cMensagem} onChange={e => setCMensagem(e.target.value)} placeholder="Sua mensagem..." rows={4}
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 16, outline: "none", boxSizing: "border-box", resize: "none", fontFamily: "system-ui, sans-serif" }} />
            {cErro && <div style={{ color: "#C00", fontSize: 12, marginBottom: 10 }}>{cErro}</div>}
            <button onClick={enviarContato} disabled={cLoading} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
              {cLoading ? "Enviando..." : "📤 Enviar mensagem"}
            </button>
            <button onClick={() => setEtapa("inicio")} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8 }}>← Voltar</button>
          </div>
        )}

        {/* SUCESSO CONTATO */}
        {etapa === "contato_ok" && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1E5C3A", marginBottom: 8 }}>Mensagem enviada!</div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 20 }}>Obrigado pelo interesse! Entraremos em contato em breve pela CRIAR.IA TECNOLOGIA.</div>
            <button onClick={() => setEtapa("inicio")} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Voltar ao início</button>
          </div>
        )}

      </div>
      <Rodape />
    </div>
  );
}
