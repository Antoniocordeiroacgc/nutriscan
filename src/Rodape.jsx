const WA_LINK = "https://wa.me/5598981114720?text=Ol%C3%A1!%20Tenho%20interesse%20no%20NutriScan%20da%20CRIAR.IA%20TECNOLOGIA.";

export default function Rodape({ dark = false }) {
  const cor     = dark ? "rgba(255,255,255,0.3)" : "#bbb";
  const corLink = dark ? "rgba(255,255,255,0.6)" : "#1E5C3A";
  const bg      = dark ? "rgba(0,0,0,0.2)" : "transparent";

  return (
    <div style={{ background: bg, padding: "14px 16px", textAlign: "center", borderTop: dark ? "none" : "1px solid #F0EFE8", marginTop: 8 }}>
      <div style={{ fontSize: 12, color: cor, marginBottom: 4 }}>
        © 2025 <strong style={{ color: corLink }}>CRIAR.IA TECNOLOGIA</strong> · Todos os direitos reservados
      </div>
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: corLink, textDecoration: "none", fontWeight: 600 }}
      >
        <span style={{ fontSize: 16 }}>💬</span>
        WhatsApp: (98) 98111-4720
      </a>
    </div>
  );
}
