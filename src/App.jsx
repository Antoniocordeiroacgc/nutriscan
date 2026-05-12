import { useState, useEffect } from "react";
import NutriDashboard from "./NutriDashboard";
import NutriScan from "./NutriScan";
import Cadastro from "./Cadastro";
import AdminPanel from "./AdminPanel";

export default function App() {
  const [tela, setTela] = useState("cadastro");
  const [paciente, setPaciente] = useState(null);

  useEffect(() => {
    const salvo = localStorage.getItem("nutriscan_paciente");
    if (salvo) {
      try { const p = JSON.parse(salvo); setPaciente(p); setTela("paciente"); } catch {}
    }
  }, []);

  const onCadastrado = (p) => {
    localStorage.setItem("nutriscan_paciente", JSON.stringify(p));
    setPaciente(p); setTela("paciente");
  };

  const sair = () => {
    localStorage.removeItem("nutriscan_paciente");
    setPaciente(null); setTela("cadastro");
  };

  if (tela === "cadastro") return <Cadastro onCadastrado={onCadastrado} />;
  if (tela === "admin") return <AdminPanel onSair={() => setTela("paciente")} />;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#F7F5F0" }}>
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @media (max-width: 480px) { .nav-sub { display: none !important; } }`}</style>

      <nav style={{ background: "#1E5C3A", padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 999, boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🥗</span>
          <div>
            <div style={{ fontWeight: 800, color: "white", fontSize: 15, lineHeight: 1.1 }}>NutriScan</div>
            <div className="nav-sub" style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" }}>CRIAR.IA TECNOLOGIA</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderRadius: 99, padding: 3, gap: 2 }}>
            {[["paciente","📱 Paciente"],["nutricionista","👩‍⚕️ Nutricionista"]].map(([key, label]) => (
              <button key={key} onClick={() => setTela(key)} style={{ background: tela === key ? "white" : "transparent", color: tela === key ? "#1E5C3A" : "rgba(255,255,255,0.65)", border: "none", borderRadius: 99, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
            ))}
          </div>
          {paciente && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginLeft: 4 }}>Olá, {paciente.nome?.split(" ")[0]}!</span>}
          <button onClick={() => setTela("admin")} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.25)", fontSize: 14, cursor: "pointer", padding: "4px" }} title="Admin">⚙️</button>
          <button onClick={sair} style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", border: "none", borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>Sair</button>
        </div>
      </nav>

      {tela === "paciente" && <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}><NutriScan paciente={paciente} /></div>}
      {tela === "nutricionista" && <div style={{ width: "100%", height: "calc(100vh - 48px)", overflow: "hidden" }}><NutriDashboard /></div>}
    </div>
  );
}
