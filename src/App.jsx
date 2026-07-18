import { useState, useEffect } from "react";
import NutriDashboard from "./NutriDashboard";
import NutriScan from "./NutriScan";
import Cadastro from "./Cadastro";
import AdminPanel from "./AdminPanel";
import Tutorial from "./Tutorial";
import Rodape from "./Rodape";

export default function App() {
  const [tela, setTela] = useState("cadastro");
  const [paciente, setPaciente] = useState(null);
  const [mostrarTutorial, setMostrarTutorial] = useState(false);

  useEffect(() => {
    // Verifica se é acesso admin pela URL
    if (window.location.pathname === "/admin") {
      setTela("admin");
      return;
    }
    try {
      const salvo = localStorage.getItem("nutriscan_paciente");
      if (salvo) {
        const p = JSON.parse(salvo);
        if (p?.id) {
          setPaciente(p);
          if (!p.pago) {
            setTela("aguardando_pagamento");
          } else {
            setTela("paciente");
          }
        }
      }
    } catch { }
  }, []);

  const onCadastrado = (p) => {
    localStorage.setItem("nutriscan_paciente", JSON.stringify(p));
    setPaciente(p);
    if (!p.pago) {
      setTela("cadastro");
      return;
    }
    setTela("paciente");
    const jaViu = localStorage.getItem(`tutorial_${p.id}`);
    if (!jaViu) setMostrarTutorial(true);
  };

  const concluirTutorial = () => {
    if (paciente?.id) {
      localStorage.setItem(`tutorial_${paciente.id}`, "true");
    }
    setMostrarTutorial(false);
  };

  const verTutorialNovamente = () => setMostrarTutorial(true);

  const sair = () => {
    localStorage.removeItem("nutriscan_paciente");
    setPaciente(null); setTela("cadastro");
  };
  if (tela === "aguardando_pagamento" && paciente) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F5F0", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "white", borderRadius: 20, padding: 32, width: "100%", maxWidth: 400, textAlign: "center", border: "1px solid #F0EFE8" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
          <div style={{ fontWeight: 800, fontSize: 20, color: "#1a1a1a", marginBottom: 8 }}>Pagamento pendente</div>
          <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 20 }}>
            Olá {paciente.nome?.split(" ")[0]}! Para acessar o NutriScan finalize o pagamento do plano mensal de <strong>R$ 34,90</strong>.
          </div>
          <button onClick={async () => {
            const response = await fetch("/api/criar-pagamento", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nome: paciente.nome, email: paciente.email, forma: "cartao", valor: 34.90, pacienteId: paciente.id }),
            });
            const data = await response.json();
            if (data.invoiceUrl) window.location.href = data.invoiceUrl;
          }} style={{ width: "100%", background: "#1E5C3A", color: "white", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
            💳 Finalizar pagamento →
          </button>
          <button onClick={sair} style={{ width: "100%", background: "transparent", color: "#666", border: "none", fontSize: 13, cursor: "pointer", padding: 8 }}>
            Sair
          </button>
        </div>
      </div>
    );
  }
  if (tela === "cadastro") return <Cadastro onCadastrado={onCadastrado} />;
  if (tela === "admin") return <AdminPanel onSair={() => setTela("cadastro")} />;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#F7F5F0", display: "flex", flexDirection: "column" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @media(max-width:480px){.nav-sub{display:none!important}}`}</style>

      {/* Tutorial overlay */}
      {mostrarTutorial && (
        <Tutorial paciente={paciente} onConcluir={concluirTutorial} />
      )}

      {/* Navbar */}
      <nav style={{ background: "#1E5C3A", padding: "0 16px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 998, boxShadow: "0 2px 12px rgba(0,0,0,0.25)", flexShrink: 0 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🥗</span>
          <div>
            <div style={{ fontWeight: 800, color: "white", fontSize: 15, lineHeight: 1.1 }}>NutriScan</div>
            <div className="nav-sub" style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" }}>CRIAR.IA TECNOLOGIA</div>
          </div>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderRadius: 99, padding: 3, gap: 2 }}>
          {[["paciente", "📱"], ["nutricionista", "👩‍⚕️"]].map(([key, icon]) => (
            <button key={key} onClick={() => setTela(key)} style={{ background: tela === key ? "white" : "transparent", color: tela === key ? "#1E5C3A" : "rgba(255,255,255,0.7)", border: "none", borderRadius: 99, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
              {icon}
            </button>
          ))}
        </div>

        {/* Direita */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {paciente && (
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", maxWidth: 70, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {paciente.nome?.split(" ")[0]}
            </span>
          )}
          <button onClick={verTutorialNovamente} title="Ver tutorial" style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "5px 8px", cursor: "pointer", fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
            ❓
          </button>
          <button onClick={sair} style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sair</button>
        </div>
      </nav>

      {/* Conteúdo */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {tela === "paciente" && (
          <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", flex: 1, display: "flex", flexDirection: "column" }}>
            <NutriScan paciente={paciente} />
            <Rodape />
          </div>
        )}
        {tela === "nutricionista" && (
          <div style={{ flex: 1, overflow: "hidden" }}>
            <NutriDashboard pacienteLogado={paciente} />
            <Rodape />
          </div>
        )}
      </div>
    </div>
  );
}
