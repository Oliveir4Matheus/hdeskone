const { Router } = require("express");
const prisma = require("../lib/prisma");
const { authRequired, optionalAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = Router();

// Create ticket - public (works without auth)
// Supports multipart (with files) or JSON
router.post("/", optionalAuth, upload.array("files", 10), async (req, res) => {
  try {
    const { title, description, priority, requester, requesterEmail, assignedId, message } =
      req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ error: "Title and description are required" });
    }

    const ticketRequester =
      requester || (req.user ? req.user.name : "anonymous");
    const ticketEmail =
      requesterEmail || (req.user ? req.user.email : null);

    const data = {
      title,
      description,
      priority: priority || "medium",
      requester: ticketRequester,
      requesterEmail: ticketEmail,
    };

    if (assignedId && req.user) {
      data.assignedId = parseInt(assignedId);
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
          content: message,
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

// List tickets
router.get("/", authRequired, async (req, res) => {
  try {
    const { status, priority, assignedId, search } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedId) where.assignedId = parseInt(assignedId);
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { requester: { contains: search, mode: "insensitive" } },
        { requesterEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get ticket detail
router.get("/:id", authRequired, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(req.params.id) },
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
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update ticket
router.put("/:id", authRequired, async (req, res) => {
  try {
    const { title, description, priority, status, assignedId } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (priority !== undefined) data.priority = priority;
    if (status !== undefined) data.status = status;
    if (assignedId !== undefined)
      data.assignedId = assignedId === null ? null : parseInt(assignedId);

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(req.params.id) },
      data,
      include: { assignedTo: { select: { id: true, name: true, email: true } } },
    });

    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete ticket
router.delete("/:id", authRequired, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    await prisma.message.deleteMany({ where: { ticketId } });
    await prisma.attachment.deleteMany({ where: { ticketId } });
    await prisma.ticket.delete({ where: { id: ticketId } });

    res.json({ message: "Ticket deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send message in ticket chat
router.post("/:id/messages", authRequired, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content is required" });

    const message = await prisma.message.create({
      data: {
        content,
        userId: req.user.id,
        ticketId: parseInt(req.params.id),
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
    const messages = await prisma.message.findMany({
      where: { ticketId: parseInt(req.params.id) },
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
      if (!req.file) return res.status(400).json({ error: "File is required" });

      const attachment = await prisma.attachment.create({
        data: {
          filename: req.file.originalname,
          path: req.file.filename,
          ticketId: parseInt(req.params.id),
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
