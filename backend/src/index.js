const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");
const configRoutes = require("./routes/config");
const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy (Cloudflare → Nginx → Express)
// 1 = trust only the immediate reverse proxy (nginx)
app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
  : [];

app.use(cors({
  origin: allowedOrigins.length > 0
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error("Not allowed by CORS"));
      }
    : true,
  credentials: true,
}));

// Global rate limit
app.use(rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/config", configRoutes);
app.use("/api/profile", profileRoutes);

// Users list for assignment dropdown
const bcrypt = require("bcryptjs");
const prisma = require("./lib/prisma");
const { authRequired, adminRequired, staffRequired } = require("./middleware/auth");

app.get("/api/users", staffRequired, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: update user (name, email, role, password)
app.put("/api/users/:id", adminRequired, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "User not found" });

    const { name, email, password, role } = req.body;
    const data = {};
    if (name !== undefined && name.trim()) data.name = name.trim().slice(0, 100);
    if (email !== undefined && email.trim()) data.email = email.trim().slice(0, 255);
    if (role !== undefined) {
      const allowedRoles = ["colaborador", "support", "admin"];
      if (allowedRoles.includes(role)) data.role = role;
    }
    if (password && password.length >= 6) {
      data.password = await bcrypt.hash(password, 10);
    } else if (password && password.length > 0) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const user = await prisma.user.update({
      where: { id },
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

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error", message: "Database unreachable" });
  }
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err.message && err.message.includes("File type")) {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large (max 10MB)" });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
