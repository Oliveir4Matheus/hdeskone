/**
 * TDD — Integração tickets.js + debouncedNotify
 * Testes 22–29 conforme mail-debounce-tdd.md
 */

jest.mock("../middleware/auth", () => ({
  authRequired: (req, res, next) => next(),
  adminRequired: (req, res, next) => next(),
  staffRequired: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
}));

jest.mock("../lib/prisma", () => ({
  ticket: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
  ticketStatus: { findMany: jest.fn() },
  message: { create: jest.fn(), findMany: jest.fn() },
  attachment: { createMany: jest.fn() },
  user: { findMany: jest.fn() },
}));

jest.mock("../lib/mailer", () => ({
  sendTicketCreated: jest.fn().mockResolvedValue(),
  sendTicketUpdated: jest.fn().mockResolvedValue(),
}));

jest.mock("../lib/mailDebounce", () => ({
  debouncedNotify: jest.fn(),
}));

jest.mock("../middleware/upload", () => ({
  array: () => (req, res, next) => { req.files = []; next(); },
  single: () => (req, res, next) => { req.file = null; next(); },
}));

const express = require("express");
const request = require("supertest");

let app, prisma, debouncedNotify;

function buildApp(role = "admin") {
  prisma = require("../lib/prisma");
  debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
  const ticketsRouter = require("../routes/tickets");
  const testApp = express();
  testApp.use(express.json());
  testApp.use((req, res, next) => {
    req.user = { id: 99, name: "Ana Staff", email: "ana@test.com", role };
    next();
  });
  testApp.use("/tickets", ticketsRouter);
  return testApp;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
  jest.mock("../middleware/auth", () => ({
    authRequired: (req, res, next) => next(),
    adminRequired: (req, res, next) => next(),
    staffRequired: (req, res, next) => next(),
    optionalAuth: (req, res, next) => next(),
  }));
  jest.mock("../lib/prisma", () => ({
    ticket: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    ticketStatus: { findMany: jest.fn() },
    message: { create: jest.fn(), findMany: jest.fn() },
    attachment: { createMany: jest.fn() },
    user: { findMany: jest.fn() },
  }));
  jest.mock("../lib/mailer", () => ({
    sendTicketCreated: jest.fn().mockResolvedValue(),
    sendTicketUpdated: jest.fn().mockResolvedValue(),
  }));
  jest.mock("../lib/mailDebounce", () => ({ debouncedNotify: jest.fn() }));
  jest.mock("../middleware/upload", () => ({
    array: () => (req, res, next) => { req.files = []; next(); },
    single: () => (req, res, next) => { req.file = null; next(); },
  }));
});

const baseTicket = {
  id: 1, title: "Ticket Teste", requester: "João",
  requesterEmail: "joao@example.com", ccEmails: null,
  status: "open", priority: "medium", assignedId: null, assignedTo: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Funcionalidade 6: PUT /tickets/:id + debounce (testes 22–26)
// ─────────────────────────────────────────────────────────────────────────────

describe("Funcionalidade 6: PUT /tickets/:id + debouncedNotify", () => {
  test("teste22: mudança de status chama debouncedNotify com changeField Status", async () => {
    app = buildApp("admin");
    prisma = require("../lib/prisma");
    debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
    prisma.ticketStatus.findMany.mockResolvedValue([{ name: "closed" }, { name: "open" }]);
    prisma.ticket.findUnique.mockResolvedValue({ ...baseTicket, assignedTo: null });
    prisma.ticket.update.mockResolvedValue({ ...baseTicket, status: "closed", assignedTo: null });

    await request(app).put("/tickets/1").send({ status: "closed" });

    expect(debouncedNotify).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ changeField: "Status", oldValue: "open", newValue: "closed" })
    );
  });

  test("teste23: mudança de priority chama debouncedNotify com changeField Prioridade", async () => {
    app = buildApp("admin");
    prisma = require("../lib/prisma");
    debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
    prisma.ticketStatus.findMany.mockResolvedValue([]);
    prisma.ticket.findUnique.mockResolvedValue({ ...baseTicket, assignedTo: null });
    prisma.ticket.update.mockResolvedValue({ ...baseTicket, priority: "urgent", assignedTo: null });

    await request(app).put("/tickets/1").send({ priority: "urgent" });

    expect(debouncedNotify).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ changeField: "Prioridade" })
    );
  });

  test("teste24: mudança de assignedId chama debouncedNotify com changeField Responsável", async () => {
    app = buildApp("admin");
    prisma = require("../lib/prisma");
    debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
    prisma.ticketStatus.findMany.mockResolvedValue([]);
    prisma.ticket.findUnique.mockResolvedValue({ ...baseTicket, assignedId: null, assignedTo: null });
    prisma.ticket.update.mockResolvedValue({
      ...baseTicket, assignedId: 5,
      assignedTo: { id: 5, name: "Pedro", email: "pedro@test.com" },
    });

    await request(app).put("/tickets/1").send({ assignedId: 5 });

    expect(debouncedNotify).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ changeField: "Responsável" })
    );
  });

  test("teste25: sem mudança real de valor não chama debouncedNotify", async () => {
    app = buildApp("admin");
    prisma = require("../lib/prisma");
    debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
    prisma.ticketStatus.findMany.mockResolvedValue([{ name: "open" }]);
    prisma.ticket.findUnique.mockResolvedValue({ ...baseTicket, assignedTo: null });
    prisma.ticket.update.mockResolvedValue({ ...baseTicket, assignedTo: null });

    await request(app).put("/tickets/1").send({ status: "open", priority: "medium" });

    expect(debouncedNotify).not.toHaveBeenCalled();
  });

  test("teste26: ticket sem requesterEmail não chama debouncedNotify", async () => {
    app = buildApp("admin");
    prisma = require("../lib/prisma");
    debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
    prisma.ticketStatus.findMany.mockResolvedValue([{ name: "closed" }]);
    const anonTicket = { ...baseTicket, requesterEmail: null };
    prisma.ticket.findUnique.mockResolvedValue({ ...anonTicket, assignedTo: null });
    prisma.ticket.update.mockResolvedValue({ ...anonTicket, status: "closed", assignedTo: null });

    await request(app).put("/tickets/1").send({ status: "closed" });

    expect(debouncedNotify).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Funcionalidade 7: POST /tickets/:id/messages + debounce (testes 27–29)
// ─────────────────────────────────────────────────────────────────────────────

describe("Funcionalidade 7: POST /tickets/:id/messages + debouncedNotify", () => {
  const msgTicket = { id: 1, title: "Ticket Chat", requester: "João", requesterEmail: "joao@example.com", ccEmails: null };
  const createdMsg = { id: 10, content: "Olá, temos uma atualização", userId: 99, ticketId: 1, user: { id: 99, name: "Ana Staff" } };

  test("teste27: mensagem de admin chama debouncedNotify com Nova mensagem no chat", async () => {
    app = buildApp("admin");
    prisma = require("../lib/prisma");
    debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
    prisma.ticket.findUnique.mockResolvedValue(msgTicket);
    prisma.message.create.mockResolvedValue(createdMsg);

    await request(app).post("/tickets/1/messages").send({ content: "Olá, temos uma atualização" });

    expect(debouncedNotify).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ changeField: "Nova mensagem no chat", chatMessage: "Olá, temos uma atualização" })
    );
  });

  test("teste28: mensagem de support também chama debouncedNotify", async () => {
    app = buildApp("support");
    prisma = require("../lib/prisma");
    debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
    prisma.ticket.findUnique.mockResolvedValue(msgTicket);
    prisma.message.create.mockResolvedValue({ ...createdMsg, userId: 88 });

    await request(app).post("/tickets/1/messages").send({ content: "Suporte aqui" });

    expect(debouncedNotify).toHaveBeenCalledTimes(1);
  });

  test("teste29: mensagem de colaborador NÃO chama debouncedNotify", async () => {
    app = buildApp("colaborador");
    prisma = require("../lib/prisma");
    debouncedNotify = require("../lib/mailDebounce").debouncedNotify;
    prisma.ticket.findUnique.mockResolvedValue({ ...msgTicket, requesterEmail: "ana@test.com" });
    prisma.message.create.mockResolvedValue(createdMsg);

    await request(app).post("/tickets/1/messages").send({ content: "Pergunta do cliente" });

    expect(debouncedNotify).not.toHaveBeenCalled();
  });
});
