const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const prisma = require("../lib/prisma");
const { authRequired, adminRequired, staffRequired, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = Router();

// Helper: validate and parse ID param
function parseId(param) {
  const id = parseInt(param, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

// Rate limit for public ticket creation
const publicTicketLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many tickets submitted, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Allowed values for ticket type and base
const ALLOWED_TYPES = ["incidente", "duvida", "melhoria", "acesso", "bug", "configuracao", "treinamento"];
const ALLOWED_BASES = ["CGH", "GRU", "BSB", "GIG", "SDU", "CNF", "CWB", "POA", "SSA", "REC", "FOR", "VCP", "MAO", "BEL", "FLN", "NAT", "MCZ", "AJU", "SLZ", "THE", "CGB", "GYN", "BPS", "CFB"];

// Create ticket - public (works without auth)
router.post("/", publicTicketLimiter, optionalAuth, upload.array("files", 10), async (req, res) => {
  try {
    const { title, description, priority, requester, requesterEmail, assignedId, message, type, base, ccEmails } =
      req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    // Validate type
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid or missing ticket type" });
    }

    // Validate base
    if (!base || !ALLOWED_BASES.includes(base)) {
      return res.status(400).json({ error: "Invalid or missing base" });
    }

    // Validate ccEmails format
    let validatedCcEmails = null;
    if (ccEmails && ccEmails.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emails = ccEmails.split(",").map((e) => e.trim()).filter(Boolean);
      for (const email of emails) {
        if (!emailRegex.test(email)) {
          return res.status(400).json({ error: `Invalid email in CC: ${email}` });
        }
      }
      validatedCcEmails = emails.join(", ").slice(0, 500);
    }

    const allowedPriorities = ["low", "medium", "high", "urgent"];
    const ticketPriority = (req.user && allowedPriorities.includes(priority)) ? priority : "medium";

    const ticketRequester =
      (requester && requester.trim()) || (req.user ? req.user.name : null) || "anonymous";
    const ticketEmail =
      (requesterEmail && requesterEmail.trim()) || (req.user ? req.user.email : null);

    const data = {
      title: title.slice(0, 255),
      description: description.slice(0, 5000),
      priority: ticketPriority,
      type,
      base,
      ccEmails: validatedCcEmails,
      requester: ticketRequester.slice(0, 100),
      requesterEmail: ticketEmail ? ticketEmail.slice(0, 255) : null,
    };

    if (assignedId && req.user) {
      const parsed = parseId(assignedId);
      if (parsed) data.assignedId = parsed;
    }

    const ticket = await prisma.ticket.create({ data });

    // Handle file attachments
    if (req.files && req.files.length > 0) {
      await prisma.attachment.createMany({
        data: req.files.map((f) => ({
          filename: f.originalname,
          path: f.filename,
          ticketId: ticket.id,
        })),
      });
    }

    // Handle initial chat message
    if (message && req.user) {
      await prisma.message.create({
        data: {
          content: message.slice(0, 5000),
          userId: req.user.id,
          ticketId: ticket.id,
        },
      });
    }

    // Return full ticket with relations
    const full = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        attachments: true,
        messages: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List tickets (with pagination)
router.get("/", authRequired, async (req, res) => {
  try {
    const { status, priority, assignedId, search, type, base } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const skip = (page - 1) * limit;

    const where = {};
    if (req.user.role === "colaborador") {
      where.requesterEmail = req.user.email;
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (base) where.base = base;
    if (assignedId) {
      const parsed = parseId(assignedId);
      if (parsed) where.assignedId = parsed;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { requester: { contains: search, mode: "insensitive" } },
        { requesterEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: { assignedTo: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get ticket detail
router.get("/:id", authRequired, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ticket ID" });

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        attachments: true,
        messages: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    if (req.user.role === "colaborador" && ticket.requesterEmail !== req.user.email) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update ticket (staff only)
router.put("/:id", staffRequired, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ticket ID" });

    const { title, description, priority, status, assignedId } = req.body;
    const data = {};
    if (title !== undefined) data.title = title.slice(0, 255);
    if (description !== undefined) data.description = description.slice(0, 5000);
    if (priority !== undefined) {
      const allowedPriorities = ["low", "medium", "high", "urgent"];
      if (allowedPriorities.includes(priority)) data.priority = priority;
    }
    if (status !== undefined) {
      // Validate against configured statuses
      const validStatuses = await prisma.ticketStatus.findMany({ select: { name: true } });
      const validNames = validStatuses.map((s) => s.name);
      if (validNames.length === 0 || validNames.includes(status)) {
        data.status = status;
      }
    }
    if (assignedId !== undefined)
      data.assignedId = assignedId === null ? null : parseId(assignedId);

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete ticket (admin only)
router.delete("/:id", adminRequired, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ticket ID" });

    await prisma.ticket.delete({ where: { id } });

    res.json({ message: "Ticket deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send message in ticket chat
router.post("/:id/messages", authRequired, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ticket ID" });

    // Colaborador can only message on their own tickets
    if (req.user.role === "colaborador") {
      const ticket = await prisma.ticket.findUnique({ where: { id }, select: { requesterEmail: true } });
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });
      if (ticket.requesterEmail !== req.user.email) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const message = await prisma.message.create({
      data: {
        content: content.slice(0, 5000),
        userId: req.user.id,
        ticketId: id,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// List messages
router.get("/:id/messages", authRequired, async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: "Invalid ticket ID" });

    const messages = await prisma.message.findMany({
      where: { ticketId: id },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload attachment
router.post(
  "/:id/attachments",
  authRequired,
  upload.single("file"),
  async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ error: "Invalid ticket ID" });
      if (!req.file) return res.status(400).json({ error: "File is required" });

      const attachment = await prisma.attachment.create({
        data: {
          filename: req.file.originalname,
          path: req.file.filename,
          ticketId: id,
        },
      });

      res.status(201).json(attachment);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
