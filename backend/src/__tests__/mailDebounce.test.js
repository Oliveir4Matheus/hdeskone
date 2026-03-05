/**
 * TDD — Debounce de Notificações por E-mail
 * Testes unitários 1–21, 30–32 conforme mail-debounce-tdd.md
 */

jest.mock("../lib/mailer", () => ({
  sendTicketUpdated: jest.fn().mockResolvedValue(),
}));

let debouncedNotify;
beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  jest.resetModules();
  jest.mock("../lib/mailer", () => ({
    sendTicketUpdated: jest.fn().mockResolvedValue(),
  }));
  debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
});

afterEach(() => {
  jest.useRealTimers();
});

const FIVE_MIN = 5 * 60 * 1000;

function makeTicket(id = 1, extra = {}) {
  return {
    id,
    title: "Ticket Teste",
    requester: "João",
    requesterEmail: "joao@example.com",
    ccEmails: null,
    status: "open",
    priority: "medium",
    ...extra,
  };
}

function makeEvent(overrides = {}) {
  return {
    changeField: "Status",
    oldValue: "open",
    newValue: "in_progress",
    updatedBy: "Ana",
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Funcionalidade 1: Agendamento do timer (testes 1–4)
// ─────────────────────────────────────────────────────────────────────────────

describe("Funcionalidade 1: Agendamento do timer", () => {
  test("teste1: primeira chamada cria entrada no mapa e agenda timer", () => {
    debouncedNotify(makeTicket(), makeEvent());
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).not.toHaveBeenCalled();
  });

  test("teste2: após 5 minutos sendTicketUpdated é chamado exatamente uma vez", async () => {
    debouncedNotify(makeTicket(), makeEvent());
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(1);
  });

  test("teste3: antes dos 5 minutos sendTicketUpdated não é chamado", async () => {
    debouncedNotify(makeTicket(), makeEvent());
    jest.advanceTimersByTime(FIVE_MIN - 1);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).not.toHaveBeenCalled();
  });

  test("teste4: dois tickets diferentes geram dois e-mails independentes", async () => {
    debouncedNotify(makeTicket(1), makeEvent());
    debouncedNotify(makeTicket(2, { requesterEmail: "maria@example.com" }), makeEvent());
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Funcionalidade 2: Reinício do timer (testes 5–7)
// ─────────────────────────────────────────────────────────────────────────────

describe("Funcionalidade 2: Trailing-edge debounce", () => {
  test("teste5: segundo evento reinicia timer — apenas 1 e-mail ao final", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent());
    jest.advanceTimersByTime(FIVE_MIN - 1000);
    debouncedNotify(ticket, makeEvent({ changeField: "Prioridade" }));

    jest.advanceTimersByTime(FIVE_MIN - 1);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(1);
  });

  test("teste6: três eventos consecutivos geram apenas 1 e-mail", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent({ changeField: "Status" }));
    debouncedNotify(ticket, makeEvent({ changeField: "Prioridade" }));
    debouncedNotify(ticket, makeEvent({ changeField: "Responsável" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(1);
  });

  test("teste7: timer desliza — 5min do primeiro evento não dispara se houve segundo", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent());
    jest.advanceTimersByTime(FIVE_MIN - 1000);
    debouncedNotify(ticket, makeEvent({ changeField: "Prioridade" }));
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Funcionalidade 3: Acumulação de mensagens de chat (testes 8–11)
// ─────────────────────────────────────────────────────────────────────────────

describe("Funcionalidade 3: Acumulação de mensagens de chat", () => {
  test("teste8: dois eventos com chatMessage — e-mail contém ambas", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent({ changeField: "Nova mensagem no chat", chatMessage: "Mensagem 1", oldValue: "-", newValue: "-" }));
    debouncedNotify(ticket, makeEvent({ changeField: "Nova mensagem no chat", chatMessage: "Mensagem 2", oldValue: "-", newValue: "-" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const { chatMessage } = require("../lib/mailer").sendTicketUpdated.mock.calls[0][1];
    expect(chatMessage).toContain("Mensagem 1");
    expect(chatMessage).toContain("Mensagem 2");
  });

  test("teste9: três eventos com chatMessage — e-mail contém as três", async () => {
    const ticket = makeTicket();
    ["Msg A", "Msg B", "Msg C"].forEach((msg) => {
      debouncedNotify(ticket, makeEvent({ changeField: "Nova mensagem no chat", chatMessage: msg, oldValue: "-", newValue: "-" }));
    });
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const { chatMessage } = require("../lib/mailer").sendTicketUpdated.mock.calls[0][1];
    expect(chatMessage).toContain("Msg A");
    expect(chatMessage).toContain("Msg B");
    expect(chatMessage).toContain("Msg C");
  });

  test('teste10: chatMessage "-" não adiciona conteúdo', async () => {
    debouncedNotify(makeTicket(), makeEvent({ chatMessage: "-" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const { chatMessage } = require("../lib/mailer").sendTicketUpdated.mock.calls[0][1];
    expect(chatMessage).toBe("-");
  });

  test("teste11: evento sem chatMessage não gera erro", async () => {
    const event = { changeField: "Status", oldValue: "open", newValue: "closed", updatedBy: "Ana" };
    expect(() => debouncedNotify(makeTicket(), event)).not.toThrow();
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(1);
    expect(mailer.sendTicketUpdated.mock.calls[0][1].chatMessage).toBe("-");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Funcionalidade 4: Seleção do campo mais significativo (testes 12–17)
// ─────────────────────────────────────────────────────────────────────────────

describe("Funcionalidade 4: Hierarquia de campos", () => {
  test("teste12: Status > Nova mensagem no chat", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent({ changeField: "Nova mensagem no chat", chatMessage: "oi", oldValue: "-", newValue: "-" }));
    debouncedNotify(ticket, makeEvent({ changeField: "Status", oldValue: "open", newValue: "closed" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(require("../lib/mailer").sendTicketUpdated.mock.calls[0][1].changeField).toBe("Status");
  });

  test("teste13: Responsável > Nova mensagem no chat", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent({ changeField: "Nova mensagem no chat", chatMessage: "oi", oldValue: "-", newValue: "-" }));
    debouncedNotify(ticket, makeEvent({ changeField: "Responsável", oldValue: "Ninguém", newValue: "Ana" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(require("../lib/mailer").sendTicketUpdated.mock.calls[0][1].changeField).toBe("Responsável");
  });

  test("teste14: Prioridade > Nova mensagem no chat", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent({ changeField: "Nova mensagem no chat", chatMessage: "oi", oldValue: "-", newValue: "-" }));
    debouncedNotify(ticket, makeEvent({ changeField: "Prioridade", oldValue: "Baixa", newValue: "Urgente" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(require("../lib/mailer").sendTicketUpdated.mock.calls[0][1].changeField).toBe("Prioridade");
  });

  test("teste15: Status > Responsável", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent({ changeField: "Responsável", oldValue: "Ninguém", newValue: "Ana" }));
    debouncedNotify(ticket, makeEvent({ changeField: "Status", oldValue: "open", newValue: "closed" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(require("../lib/mailer").sendTicketUpdated.mock.calls[0][1].changeField).toBe("Status");
  });

  test("teste16: apenas Nova mensagem no chat — usa Nova mensagem no chat", async () => {
    debouncedNotify(makeTicket(), makeEvent({ changeField: "Nova mensagem no chat", chatMessage: "olá", oldValue: "-", newValue: "-" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(require("../lib/mailer").sendTicketUpdated.mock.calls[0][1].changeField).toBe("Nova mensagem no chat");
  });

  test("teste17: sem changeField reconhecido — usa fallback Atualização", async () => {
    debouncedNotify(makeTicket(), { updatedBy: "Ana" });
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(require("../lib/mailer").sendTicketUpdated.mock.calls[0][1].changeField).toBe("Atualização");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Funcionalidade 5: Dados do e-mail enviado (testes 18–21)
// ─────────────────────────────────────────────────────────────────────────────

describe("Funcionalidade 5: Dados do e-mail enviado", () => {
  test("teste18: updatedBy é o ator do último evento", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent({ updatedBy: "Primeiro" }));
    debouncedNotify(ticket, makeEvent({ updatedBy: "Último" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(require("../lib/mailer").sendTicketUpdated.mock.calls[0][1].updatedBy).toBe("Último");
  });

  test("teste19: oldValue e newValue correspondem ao evento de maior prioridade", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent({ changeField: "Prioridade", oldValue: "Baixa", newValue: "Alta" }));
    debouncedNotify(ticket, makeEvent({ changeField: "Status", oldValue: "open", newValue: "closed" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const args = require("../lib/mailer").sendTicketUpdated.mock.calls[0][1];
    expect(args.changeField).toBe("Status");
    expect(args.oldValue).toBe("open");
    expect(args.newValue).toBe("closed");
  });

  test("teste20: ticket passado é o do último evento", async () => {
    const ticketV1 = makeTicket(1, { status: "open" });
    const ticketV2 = makeTicket(1, { status: "closed" });
    debouncedNotify(ticketV1, makeEvent());
    debouncedNotify(ticketV2, makeEvent({ changeField: "Status", newValue: "closed" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(require("../lib/mailer").sendTicketUpdated.mock.calls[0][0].status).toBe("closed");
  });

  test("teste21: após flush a entrada é removida — novo evento inicia novo ciclo", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent());
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(1);

    jest.clearAllMocks();
    debouncedNotify(ticket, makeEvent({ changeField: "Prioridade" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Funcionalidade 8: Robustez e isolamento (testes 30–32)
// ─────────────────────────────────────────────────────────────────────────────

describe("Funcionalidade 8: Robustez e isolamento", () => {
  test("teste30: sendTicketUpdated lançando exceção não derruba o processo", async () => {
    const mailer = require("../lib/mailer");
    mailer.sendTicketUpdated.mockRejectedValueOnce(new Error("API down"));
    debouncedNotify(makeTicket(), makeEvent());
    await expect(
      (async () => {
        jest.advanceTimersByTime(FIVE_MIN);
        await Promise.resolve();
      })()
    ).resolves.not.toThrow();
  });

  test("teste31: após flush, novo evento inicia ciclo independente", async () => {
    const ticket = makeTicket();
    debouncedNotify(ticket, makeEvent());
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();

    debouncedNotify(ticket, makeEvent({ changeField: "Prioridade" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(1);
  });

  test("teste32: atividade intercalada A→B→A→B resulta em 2 e-mails independentes", async () => {
    const ticketA = makeTicket(1);
    const ticketB = makeTicket(2, { requesterEmail: "b@example.com" });
    debouncedNotify(ticketA, makeEvent({ updatedBy: "A1" }));
    debouncedNotify(ticketB, makeEvent({ updatedBy: "B1" }));
    debouncedNotify(ticketA, makeEvent({ updatedBy: "A2" }));
    debouncedNotify(ticketB, makeEvent({ updatedBy: "B2" }));
    jest.advanceTimersByTime(FIVE_MIN);
    await Promise.resolve();
    const mailer = require("../lib/mailer");
    expect(mailer.sendTicketUpdated).toHaveBeenCalledTimes(2);
    expect(mailer.sendTicketUpdated.mock.calls.some((c) => c[0].id === 1 && c[1].updatedBy === "A2")).toBe(true);
    expect(mailer.sendTicketUpdated.mock.calls.some((c) => c[0].id === 2 && c[1].updatedBy === "B2")).toBe(true);
  });
});
