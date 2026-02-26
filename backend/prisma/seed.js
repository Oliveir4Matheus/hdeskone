const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@helpdesk.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@helpdesk.com",
      password: hash,
      role: "admin",
    },
  });

  const statuses = [
    { name: "open", color: "#22c55e", order: 0 },
    { name: "in_progress", color: "#3b82f6", order: 1 },
    { name: "waiting", color: "#f59e0b", order: 2 },
    { name: "closed", color: "#6b7280", order: 3 },
  ];

  for (const s of statuses) {
    await prisma.ticketStatus.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
