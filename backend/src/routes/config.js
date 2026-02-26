const { Router } = require("express");
const prisma = require("../lib/prisma");
const { authRequired, adminRequired } = require("../middleware/auth");

const router = Router();

const PROTECTED_STATUSES = ["open", "in_progress", "closed"];

// List statuses (auth required)
router.get("/statuses", authRequired, async (req, res) => {
  try {
    const statuses = await prisma.ticketStatus.findMany({
      orderBy: { order: "asc" },
    });
    res.json(statuses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create status (admin only)
router.post("/statuses", adminRequired, async (req, res) => {
  try {
    const { name, color, order } = req.body;
    if (!name) return res.status(400).json({ error: "Name is required" });

    const status = await prisma.ticketStatus.create({
      data: { name, color: color || "#6b7280", order: order || 0 },
    });
    res.status(201).json(status);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Status name already exists" });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update status (admin only)
router.put("/statuses/:id", adminRequired, async (req, res) => {
  try {
    const existing = await prisma.ticketStatus.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!existing) return res.status(404).json({ error: "Status not found" });

    const { name, color, order } = req.body;
    const data = {};

    // Protected statuses cannot be renamed
    if (PROTECTED_STATUSES.includes(existing.name) && name !== undefined && name !== existing.name) {
      return res.status(400).json({ error: "Cannot rename a protected status" });
    }

    if (name !== undefined) data.name = name;
    if (color !== undefined) data.color = color;
    if (order !== undefined) data.order = order;

    const status = await prisma.ticketStatus.update({
      where: { id: existing.id },
      data,
    });
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete status (admin only)
router.delete("/statuses/:id", adminRequired, async (req, res) => {
  try {
    const existing = await prisma.ticketStatus.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!existing) return res.status(404).json({ error: "Status not found" });

    if (PROTECTED_STATUSES.includes(existing.name)) {
      return res.status(400).json({ error: "Cannot delete a protected status" });
    }

    await prisma.ticketStatus.delete({ where: { id: existing.id } });
    res.json({ message: "Status deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
