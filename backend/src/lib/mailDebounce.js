/**
 * Debounced email notifications for ticket updates.
 *
 * Instead of sending one email per event (status change, chat message, etc.),
 * we accumulate all events for a ticket within a rolling window and send a
 * single summary email after DEBOUNCE_MS of inactivity.
 */

const { sendTicketUpdated } = require("./mailer");

// 5 minutes of inactivity → fire email
const DEBOUNCE_MS = 5 * 60 * 1000;

// Map<ticketId, { timer, ticket, events[] }>
const pending = new Map();

/**
 * Schedule (or reschedule) a debounced notification for a ticket.
 *
 * @param {object} ticket  - Latest ticket object (with requesterEmail, ccEmails, etc.)
 * @param {object} event   - { changeField, oldValue, newValue, updatedBy, chatMessage }
 */
function debouncedNotify(ticket, event) {
  const id = ticket.id;

  let entry = pending.get(id);
  if (entry) {
    // Reset the timer — we received another event before the window expired
    clearTimeout(entry.timer);
  } else {
    entry = { events: [] };
    pending.set(id, entry);
  }

  // Always keep the latest ticket data (status/assigned may have changed)
  entry.ticket = ticket;
  entry.events.push(event);

  entry.timer = setTimeout(() => {
    pending.delete(id);
    _flush(entry).catch((err) =>
      console.error("[mailDebounce] flush error:", err.message)
    );
  }, DEBOUNCE_MS);
}

/**
 * Build a summary and send one email for all accumulated events.
 */
async function _flush(entry) {
  const { ticket, events } = entry;

  // Pick the most significant field change to show as the primary update.
  // Priority order: Status > Responsável > Prioridade > chat message
  const FIELD_PRIORITY = ["Status", "Responsável", "Prioridade"];
  let mainChange = null;
  for (const field of FIELD_PRIORITY) {
    mainChange = events.find((e) => e.changeField === field);
    if (mainChange) break;
  }
  // Fallback: last event
  if (!mainChange) mainChange = events[events.length - 1];

  // Collect all chat messages sent during this window
  const chatMessages = events
    .filter((e) => e.chatMessage && e.chatMessage !== "-")
    .map((e) => e.chatMessage);

  // The "updatedBy" shown in the email is the last actor
  const updatedBy = events[events.length - 1].updatedBy;

  await sendTicketUpdated(ticket, {
    changeField: mainChange.changeField || "Atualização",
    oldValue: mainChange.oldValue || "-",
    newValue: mainChange.newValue || "-",
    updatedBy,
    chatMessage: chatMessages.length > 0 ? chatMessages.join("\n\n") : "-",
  });
}

module.exports = { debouncedNotify };
