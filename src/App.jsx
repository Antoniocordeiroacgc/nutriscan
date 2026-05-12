import { useState } from "react";
import NutriDashboard from "./NutriDashboard";
import NutriScan from "./NutriScan";

export default function App() {
  const [tela, setTela] = useState("paciente");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#F7F5F0" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @media (max-width: 480px) {
          .nav-sub { display: none !important; }
          .nav-btn span.label { display: none; }
        }
      `}</style>

      {/* Navbar fixa no topo */}
      <nav style={{
        background: "#1E5C3A",
        padding: "10px 16px",
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
          <span style={{ fontSize: 24 }}>🥗</span>
          <div>
            <div style={{ fontWeight: 800, color: "white", fontSize: 16, lineHeight: 1.1 }}>NutriScan</div>
            <div className="nav-sub" style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", letterSpacing: 1.2, textTransform: "uppercase" }}>
              CRIAR.IA TECNOLOGIA
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div style={{
          display: "flex",
          background: "rgba(0,0,0,0.25)",
          borderRadius: 99,
          padding: 3,
          gap: 2
        }}>
          <button
            className="nav-btn"
            onClick={() => setTela("paciente")}
            style={{
              background: tela === "paciente" ? "white" : "transparent",
              color: tela === "paciente" ? "#1E5C3A" : "rgba(255,255,255,0.65)",
              border: "none", borderRadius: 99,
              padding: "7px 16px", fontSize: 13,
              fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 5
            }}
          >
            📱 <span className="label">Paciente</span>
          </button>
          <button
            className="nav-btn"
            onClick={() => setTela("nutricionista")}
            style={{
              background: tela === "nutricionista" ? "white" : "transparent",
              color: tela === "nutricionista" ? "#1E5C3A" : "rgba(255,255,255,0.65)",
              border: "none", borderRadius: 99,
              padding: "7px 16px", fontSize: 13,
              fontWeight: 700, cursor: "pointer",
              transition: "all 0.2s", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 5
            }}
          >
            👩‍⚕️ <span className="label">Nutricionista</span>
          </button>
        </div>
      </nav>

      {/* Tela do Paciente */}
      {tela === "paciente" && (
        <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", minHeight: "calc(100vh - 48px)" }}>
          <NutriScan />
        </div>
      )}

      {/* Tela da Nutricionista */}
      {tela === "nutricionista" && (
        <div style={{ width: "100%", height: "calc(100vh - 48px)", overflow: "hidden" }}>
          <NutriDashboard />
        </div>
      )}

    </div>
  );
}
