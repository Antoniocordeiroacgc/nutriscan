// api/criar-pagamento.js
// Cria uma cobrança no Mercado Pago (Pix ou Cartão via Checkout Pro)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const { nome, email, cpf, forma, valor, pacienteId } = req.body;

  if (!nome || !email || !forma || !pacienteId) {
    return res.status(400).json({ error: "Dados obrigatórios faltando" });
  }

  const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!ACCESS_TOKEN) {
    return res.status(500).json({ error: "Token Mercado Pago não configurado no servidor" });
  }

  const VALOR_PLANO = valor || 34.90;

  try {
    if (forma === "pix" || forma === "cartao") {
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          items: [{
            title: "NutriScan — Plano Mensal",
            quantity: 1,
            unit_price: VALOR_PLANO,
            currency_id: "BRL",
          }],
          payer: { email, name: nome },
          external_reference: pacienteId,
          notification_url: "https://nutriscan.ia.br/api/webhook-mercadopago",
          back_urls: {
            success: "https://nutriscan.ia.br?pagamento=sucesso",
            failure: "https://nutriscan.ia.br?pagamento=erro",
            pending: "https://nutriscan.ia.br?pagamento=pendente",
          },
          auto_return: "approved",
          payment_methods: {
            default_payment_method_id: "pix",
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(400).json({ error: data.message || "Erro ao criar checkout" });
      }

      return res.status(200).json({
        preferenceId: data.id,
        invoiceUrl: data.init_point,
      });
    }

    if (forma === "cartao") {
      // ── CARTÃO — Checkout Pro (redireciona para página segura do Mercado Pago) ──
      const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${ACCESS_TOKEN}`,
        },
        body: JSON.stringify({
          items: [{
            title: "NutriScan — Plano Mensal",
            quantity: 1,
            unit_price: VALOR_PLANO,
            currency_id: "BRL",
          }],
          payer: { email, name: nome },
          external_reference: pacienteId,
          notification_url: "https://nutriscan-rho.vercel.app/api/webhook-mercadopago",
          back_urls: {
            success: "https://nutriscan-rho.vercel.app?pagamento=sucesso",
            failure: "https://nutriscan-rho.vercel.app?pagamento=erro",
            pending: "https://nutriscan-rho.vercel.app?pagamento=pendente",
          },
          auto_return: "approved",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return res.status(400).json({ error: data.message || "Erro ao criar checkout" });
      }

      return res.status(200).json({
        preferenceId: data.id,
        invoiceUrl: data.init_point, // link para redirecionar o paciente
      });
    }

    return res.status(400).json({ error: "Forma de pagamento inválida" });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
