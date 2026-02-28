const MAIL_API_BASE_URL = (process.env.MAIL_API_BASE_URL || "").replace(/\/$/, "");
const MAIL_API_KEY = process.env.MAIL_API_KEY;
const MAIL_CAMPAIGN_CREATED_ID = process.env.MAIL_CAMPAIGN_CREATED_ID;
const MAIL_CAMPAIGN_UPDATED_ID = process.env.MAIL_CAMPAIGN_UPDATED_ID;
const APP_URL = process.env.APP_URL || "";

const TYPE_LABELS = {
  incidente: "Incidente",
  duvida: "Dúvida",
  melhoria: "Melhoria",
  acesso: "Acesso",
  bug: "Bug",
  configuracao: "Configuração",
  treinamento: "Treinamento",
};

function formatDate(date) {
  return new Date(date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

// Returns the main recipient and a separate cc list from ticket.ccEmails
function buildPayload(ticket, variables) {
  const recipients = [];

  if (ticket.requesterEmail) {
    recipients.push({
      email: ticket.requesterEmail,
      name: ticket.requester || undefined,
      variables,
    });
  }

  const cc = ticket.ccEmails
    ? ticket.ccEmails
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e && e !== ticket.requesterEmail)
    : [];

  return { recipients, cc };
}

async function runCampaign(campaignId, recipients, cc = []) {
  if (!MAIL_API_BASE_URL || !MAIL_API_KEY || !campaignId) {
    console.warn("[mailer] Skipping — MAIL_API_BASE_URL, MAIL_API_KEY ou campaign ID não configurados");
    return;
  }
  if (!recipients || recipients.length === 0) return;

  const body = { recipients };
  if (cc.length > 0) body.cc = cc;

  const res = await fetch(`${MAIL_API_BASE_URL}/api/campaigns/${campaignId}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MAIL_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Campaign ${campaignId} API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  console.log(`[mailer] Campaign ${campaignId} started — task_id: ${data.task_id}`);
}

async function sendTicketCreated(ticket, { attachmentNames = [], initialMessage = "" } = {}) {
  if (!ticket.requesterEmail) return;

  const variables = {
    ticketId: String(ticket.id),
    title: ticket.title,
    type: TYPE_LABELS[ticket.type] || ticket.type,
    base: ticket.base,
    priority: ticket.priority,
    requester: ticket.requester,
    requesterEmail: ticket.requesterEmail,
    createdAt: formatDate(ticket.createdAt),
    description: ticket.description,
    attachments: attachmentNames.length > 0 ? attachmentNames.join("\n") : "Nenhum",
    message: initialMessage || "-",
    ticketUrl: `${APP_URL}/tickets/${ticket.id}`,
  };

  const { recipients, cc } = buildPayload(ticket, variables);
  await runCampaign(MAIL_CAMPAIGN_CREATED_ID, recipients, cc);
}

async function sendTicketUpdated(ticket, { changeField, oldValue, newValue, updatedBy, chatMessage = "" }) {
  if (!ticket.requesterEmail) return;

  const variables = {
    ticketId: String(ticket.id),
    title: ticket.title,
    changeField,
    oldValue: oldValue || "-",
    newValue: newValue || "-",
    updatedBy,
    updatedAt: formatDate(new Date()),
    chatMessage: chatMessage || "-",
    ticketUrl: `${APP_URL}/tickets/${ticket.id}`,
  };

  const { recipients, cc } = buildPayload(ticket, variables);
  await runCampaign(MAIL_CAMPAIGN_UPDATED_ID, recipients, cc);
}

module.exports = { sendTicketCreated, sendTicketUpdated };
