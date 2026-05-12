import { useState } from "react";
import { supabase } from "./lib/supabase";

const OBJETIVOS = [
  { id: "emagrecimento", label: "⚖️ Emagrecimento", meta: 1500 },
  { id: "ganho_massa",   label: "💪 Ganho de massa", meta: 2500 },
  { id: "saude_geral",   label: "🌱 Saúde geral",    meta: 1850 },
];

export default function Cadastro({ onCadastrado }) {
  const [etapa, setEtapa] = useState(1); // 1=inicio, 2=dados, 3=objetivo, 4=sucesso
  const [nome, setNome]   = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState("");

  const cadastrar = async () => {
    if (!nome || !email || !senha || !objetivo) {
      setErro("Preencha todos os campos."); return;
    }
    setLoading(true); setErro("");
    try {
      const obj = OBJETIVOS.find(o => o.id === objetivo);
      const trialFim = new Date();
      trialFim.setDate(trialFim.getDate() + 30);

      const { data, error } = await supabase
        .from("pacientes")
        .insert({
          nome,
          email,
          senha,
          objetivo: obj.label,
          meta_kcal: obj.meta,
          plano: "teste",
          trial_inicio: new Date().toISOString(),
          trial_fim: trialFim.toISOString(),
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;
      setEtapa(4);
      setTimeout(() => onCadastrado(data), 2000);
    } catch (e) {
      setErro(e.message?.includes("unique") ? "Este e-mail já está cadastrado." : e.message);
    }
    setLoading(false);
  };

  const entrar = async () => {
    if (!email || !senha) { setErro("Preencha e-mail e senha."); return; }
    setLoading(true); setErro("");
    try {
     const { data, error } = await supabase
      .from("pacientes")
      .select("*")
      .eq("email", email)
      .eq("senha", senha)
      .maybeSingle();
    if (!data) throw new Error("E-mail ou senha incorretos.");
      onCadastrado(data);
    } catch (e) {
      setErro(e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#F7F5F0",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "system-ui, sans-serif"
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .card { animation: fadeUp 0.4s ease; }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🥗</div>
        <div style={{ fontWeight: 800, fontSize: 26, color: "#1E5C3A" }}>NutriScan</div>
        <div style={{ fontSize: 11, color: "#aaa", letterSpacing: 1.5, textTransform: "uppercase" }}>
          CRIAR.IA TECNOLOGIA
        </div>
      </div>

      {/* Banner trial */}
      <div style={{
        background: "#1E5C3A", borderRadius: 14, padding: "12px 20px",
        marginBottom: 24, textAlign: "center", maxWidth: 400, width: "100%"
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#7DFCA8", marginBottom: 2 }}>
          🎉 Período de testes — 30 dias grátis!
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
          Faça parte do programa piloto do NutriScan. Sem cartão de crédito.
        </div>
      </div>

      <div className="card" style={{
        background: "white", borderRadius: 20, padding: 24,
        width: "100%", maxWidth: 400, border: "1px solid #F0EFE8"
      }}>

        {/* Etapa 1 — Início */}
        {etapa === 1 && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginBottom: 6 }}>
              Bem-vindo ao NutriScan! 👋
            </div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 24, lineHeight: 1.6 }}>
              Fotografe seus pratos e receba análise calórica por IA. Sua nutricionista acompanha tudo em tempo real.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["🤖", "IA identifica alimentos automaticamente"],
                ["📊", "Calorias calculadas em segundos"],
                ["👩‍⚕️", "Nutricionista acompanha seu progresso"],
                ["📱", "Funciona no celular pela câmera"],
              ].map(([icon, text], i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: "#555" }}>{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEtapa(2)}
              style={{
                width: "100%", background: "#1E5C3A", color: "white",
                border: "none", borderRadius: 12, padding: 14,
                fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 24
              }}
            >
              Criar conta grátis →
            </button>
            <button
              onClick={() => setEtapa("login")}
              style={{
                width: "100%", background: "transparent", color: "#666",
                border: "1px solid #E8E8E0", borderRadius: 12, padding: 12,
                fontSize: 13, cursor: "pointer", marginTop: 8
              }}
            >
              Já tenho conta — Entrar
            </button>
          </div>
        )}

        {/* Login */}
        {etapa === "login" && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginBottom: 20 }}>
              Entrar na sua conta
            </div>
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              type="email"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }}
            />
            <input
              value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="Senha"
              type="password"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 16, outline: "none", boxSizing: "border-box" }}
            />
            {erro && <div style={{ color: "#C00", fontSize: 12, marginBottom: 12 }}>{erro}</div>}
            <button
              onClick={entrar}
              disabled={loading}
              style={{
                width: "100%", background: "#1E5C3A", color: "white",
                border: "none", borderRadius: 12, padding: 14,
                fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <button
              onClick={() => { setEtapa(1); setErro(""); }}
              style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8 }}
            >
              ← Voltar
            </button>
          </div>
        )}

        {/* Etapa 2 — Dados */}
        {etapa === 2 && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 4 }}>
              Seus dados
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 20 }}>Etapa 1 de 2</div>
            <input
              value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Seu nome completo"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }}
            />
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Seu melhor e-mail"
              type="email"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 10, outline: "none", boxSizing: "border-box" }}
            />
            <input
              value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="Crie uma senha"
              type="password"
              style={{ width: "100%", border: "1px solid #E8E8E0", borderRadius: 10, padding: "10px 12px", fontSize: 14, marginBottom: 16, outline: "none", boxSizing: "border-box" }}
            />
            <button
              onClick={() => { if (!nome || !email || !senha) { setErro("Preencha todos os campos."); return; } setErro(""); setEtapa(3); }}
              style={{
                width: "100%", background: "#1E5C3A", color: "white",
                border: "none", borderRadius: 12, padding: 14,
                fontSize: 15, fontWeight: 700, cursor: "pointer"
              }}
            >
              Continuar →
            </button>
            {erro && <div style={{ color: "#C00", fontSize: 12, marginTop: 10 }}>{erro}</div>}
            <button onClick={() => setEtapa(1)} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8, marginTop: 4 }}>← Voltar</button>
          </div>
        )}

        {/* Etapa 3 — Objetivo */}
        {etapa === 3 && (
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#1a1a1a", marginBottom: 4 }}>
              Qual é o seu objetivo?
            </div>
            <div style={{ fontSize: 12, color: "#aaa", marginBottom: 20 }}>Etapa 2 de 2 — Escolha um</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {OBJETIVOS.map(o => (
                <button
                  key={o.id}
                  onClick={() => setObjetivo(o.id)}
                  style={{
                    background: objetivo === o.id ? "#EEF7F2" : "white",
                    border: objetivo === o.id ? "2px solid #1E5C3A" : "1.5px solid #E8E8E0",
                    borderRadius: 12, padding: "14px 16px", fontSize: 15,
                    fontWeight: objetivo === o.id ? 700 : 500,
                    color: objetivo === o.id ? "#1E5C3A" : "#555",
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s"
                  }}
                >
                  {o.label}
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 400, marginTop: 2 }}>
                    Meta: {o.meta} kcal/dia
                  </div>
                </button>
              ))}
            </div>
            {erro && <div style={{ color: "#C00", fontSize: 12, marginBottom: 10 }}>{erro}</div>}
            <button
              onClick={cadastrar}
              disabled={loading || !objetivo}
              style={{
                width: "100%", background: objetivo ? "#1E5C3A" : "#ccc",
                color: "white", border: "none", borderRadius: 12, padding: 14,
                fontSize: 15, fontWeight: 700, cursor: objetivo ? "pointer" : "not-allowed"
              }}
            >
              {loading ? "Criando conta..." : "🚀 Começar agora — grátis!"}
            </button>
            <button onClick={() => setEtapa(2)} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8, marginTop: 4 }}>← Voltar</button>
          </div>
        )}

        {/* Etapa 4 — Sucesso */}
        {etapa === 4 && (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: "#1E5C3A", marginBottom: 8 }}>
              Conta criada com sucesso!
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              Bem-vindo ao NutriScan!<br />
              Seu período de <strong>30 dias grátis</strong> começou agora.
            </div>
            <div style={{ marginTop: 16, fontSize: 12, color: "#aaa" }}>
              Entrando no app...
            </div>
          </div>
        )}

      </div>

      <div style={{ marginTop: 20, fontSize: 11, color: "#bbb", textAlign: "center" }}>
        © 2025 CRIAR.IA TECNOLOGIA · Todos os direitos reservados
      </div>
    </div>
  );
}
