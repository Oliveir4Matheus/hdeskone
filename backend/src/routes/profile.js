const { Router } = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../lib/prisma");
const { authRequired } = require("../middleware/auth");

const router = Router();

// Get profile
router.get("/", authRequired, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update profile
router.put("/", authRequired, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) {
      const passwordRules = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
      if (!passwordRules.test(password)) {
        return res.status(400).json({ error: "A senha deve ter no mínimo 8 caracteres, 1 maiúscula, 1 número e 1 caractere especial" });
      }
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Email already in use" });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
