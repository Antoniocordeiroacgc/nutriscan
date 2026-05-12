import { useState, useEffect } from "react";
import NutriDashboard from "./NutriDashboard";
import NutriScan from "./NutriScan";
import Cadastro from "./Cadastro";
import AdminPanel from "./AdminPanel";

export default function App() {
  const [tela, setTela] = useState("cadastro");
  const [paciente, setPaciente] = useState(null);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem("nutriscan_paciente");
      if (salvo) {
        const p = JSON.parse(salvo);
        if (p && p.id) { setPaciente(p); setTela("paciente"); }
      }
    } catch {}
  }, []);

  const onCadastrado = (p) => {
    localStorage.setItem("nutriscan_paciente", JSON.stringify(p));
    setPaciente(p);
    setTela("paciente");
  };

  const sair = () => {
    localStorage.removeItem("nutriscan_paciente");
    setPaciente(null);
    setTela("cadastro");
  };

  if (tela === "cadastro") return <Cadastro onCadastrado={onCadastrado} />;
  if (tela === "admin") return <AdminPanel onSair={() => setTela("paciente")} />;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#F7F5F0" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 600px) {
          .nav-nome { display: none !important; }
          .nav-sub { display: none !important; }
          .nav-btn-label { display: none !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        background: "#1E5C3A",
        padding: "0 16px",
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 999,
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)"
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>🥗</span>
          <div>
            <div style={{ fontWeight: 800, color: "white", fontSize: 15, lineHeight: 1.1 }}>NutriScan</div>
            <div className="nav-sub" style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" }}>
              CRIAR.IA TECNOLOGIA
            </div>
          </div>
        </div>

        {/* Centro — Toggle telas */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", borderRadius: 99, padding: 3, gap: 2 }}>
          <button
            onClick={() => setTela("paciente")}
            style={{
              background: tela === "paciente" ? "white" : "transparent",
              color: tela === "paciente" ? "#1E5C3A" : "rgba(255,255,255,0.7)",
              border: "none", borderRadius: 99,
              padding: "6px 14px", fontSize: 12,
              fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              whiteSpace: "nowrap"
            }}
          >
            📱 <span className="nav-btn-label">Paciente</span>
          </button>
          <button
            onClick={() => setTela("nutricionista")}
            style={{
              background: tela === "nutricionista" ? "white" : "transparent",
              color: tela === "nutricionista" ? "#1E5C3A" : "rgba(255,255,255,0.7)",
              border: "none", borderRadius: 99,
              padding: "6px 14px", fontSize: 12,
              fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              whiteSpace: "nowrap"
            }}
          >
            👩‍⚕️ <span className="nav-btn-label">Nutricionista</span>
          </button>
        </div>

        {/* Direita — usuário + admin + sair */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Nome do paciente */}
          {paciente && (
            <div className="nav-nome" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0
              }}>
                {paciente.nome?.charAt(0).toUpperCase() || "P"}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {paciente.nome?.split(" ")[0]}
              </span>
            </div>
          )}

          {/* Botão Admin */}
          <button
            onClick={() => setTela("admin")}
            title="Painel Admin"
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "none",
              borderRadius: 8,
              padding: "5px 8px",
              cursor: "pointer",
              fontSize: 14,
              color: "rgba(255,255,255,0.6)",
              display: "flex", alignItems: "center"
            }}
          >
            ⚙️
          </button>

          {/* Botão Sair */}
          <button
            onClick={sair}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Tela do Paciente */}
      {tela === "paciente" && (
        <div style={{ maxWidth: 480, margin: "0 auto", width: "100%" }}>
          <NutriScan paciente={paciente} />
        </div>
      )}

      {/* Tela da Nutricionista */}
      {tela === "nutricionista" && (
        <div style={{ width: "100%", height: "calc(100vh - 52px)", overflow: "hidden" }}>
          <NutriDashboard />
        </div>
      )}

    </div>
  );
}
