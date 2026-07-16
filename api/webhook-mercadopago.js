// api/webhook-mercadopago.js
// Recebe notificações do Mercado Pago quando um pagamento muda de status
// Configure no painel do Mercado Pago: Suas integrações > [sua app] > Webhooks
// URL: https://nutriscan-rho.vercel.app/api/webhook-mercadopago
// Eventos: Pagamentos

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // chave de serviço — Settings > API > service_role no Supabase
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { type, data } = req.body;

    // O Mercado Pago manda vários tipos de eventos — só nos importa "payment"
    if (type !== "payment") {
      return res.status(200).json({ received: true });
    }

    const paymentId = data?.id;
    if (!paymentId) {
      return res.status(200).json({ received: true });
    }

    const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // Busca os detalhes reais do pagamento na API (nunca confie só no payload do webhook)
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${ACCESS_TOKEN}` },
    });
    const payment = await response.json();

    if (payment.status === "approved") {
      const pacienteId = payment.external_reference;
      const forma = payment.payment_method_id === "pix" ? "pix" : "cartao";

      const { error } = await supabase
        .from("pacientes")
        .update({
          pago: true,
          forma_pagamento: forma,
          valor_pago: payment.transaction_amount,
          data_pagamento: new Date().toISOString(),
          asaas_payment_id: String(payment.id), // reaproveitando a coluna pra guardar o ID do MP
        })
        .eq("id", pacienteId);

      if (error) {
        console.error("Erro ao atualizar paciente:", error);
      }
    }

    return res.status(200).json({ received: true });

  } catch (e) {
    console.error("Erro no webhook Mercado Pago:", e);
    return res.status(500).json({ error: e.message });
  }
}
