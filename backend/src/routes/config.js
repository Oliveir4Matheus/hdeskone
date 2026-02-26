const { Router } = require("express");
const prisma = require("../lib/prisma");
const { authRequired, adminRequired } = require("../middleware/auth");

const router = Router();

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
    const { name, color, order } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (color !== undefined) data.color = color;
    if (order !== undefined) data.order = order;

    const status = await prisma.ticketStatus.update({
      where: { id: parseInt(req.params.id) },
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
    await prisma.ticketStatus.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ message: "Status deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
