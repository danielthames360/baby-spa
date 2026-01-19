import { PrismaClient, UserRole, Gender, BirthType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ============================================================
  // USUARIOS (Staff)
  // ============================================================
  console.log("Creating users...");

  const adminPassword = await hash("admin123", 12);
  const recepPassword = await hash("recep123", 12);
  const therapistPassword = await hash("terapeuta123", 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@babyspa.com",
      passwordHash: adminPassword,
      name: "Administrador",
      role: UserRole.ADMIN,
      phone: "+591 70000001",
      baseSalary: 5000,
    },
  });

  const reception = await prisma.user.upsert({
    where: { username: "recepcion" },
    update: {},
    create: {
      username: "recepcion",
      email: "recepcion@babyspa.com",
      passwordHash: recepPassword,
      name: "María García",
      role: UserRole.RECEPTION,
      phone: "+591 70000002",
      baseSalary: 2500,
    },
  });

  const therapist1 = await prisma.user.upsert({
    where: { username: "terapeuta1" },
    update: {},
    create: {
      username: "terapeuta1",
      email: "terapeuta1@babyspa.com",
      passwordHash: therapistPassword,
      name: "Ana Rodríguez",
      role: UserRole.THERAPIST,
      phone: "+591 70000003",
      baseSalary: 3000,
    },
  });

  const therapist2 = await prisma.user.upsert({
    where: { username: "terapeuta2" },
    update: {},
    create: {
      username: "terapeuta2",
      email: "terapeuta2@babyspa.com",
      passwordHash: therapistPassword,
      name: "Carlos López",
      role: UserRole.THERAPIST,
      phone: "+591 70000004",
      baseSalary: 3000,
    },
  });

  console.log("Users created:", {
    admin: admin.username,
    reception: reception.username,
    therapist1: therapist1.username,
    therapist2: therapist2.username,
  });

  // ============================================================
  // PADRE DE PRUEBA (para Portal)
  // ============================================================
  console.log("Creating test parent...");

  const testParent = await prisma.parent.upsert({
    where: { documentId: "12345678" },
    update: {},
    create: {
      documentId: "12345678",
      documentType: "CI",
      phone: "+591 71234567",
      name: "Laura Martínez",
      email: "laura@example.com",
      accessCode: "BSB-TEST1",
    },
  });

  console.log("Test parent created with access code:", testParent.accessCode);

  // ============================================================
  // BEBÉ DE PRUEBA
  // ============================================================
  console.log("Creating test baby...");

  const testBaby = await prisma.baby.upsert({
    where: { id: "test-baby-1" },
    update: {},
    create: {
      id: "test-baby-1",
      name: "Sofía Martínez",
      birthDate: new Date("2025-06-15"),
      gender: Gender.FEMALE,
      birthWeeks: 39,
      birthWeight: 3.2,
      birthType: BirthType.NATURAL,
      socialMediaConsent: true,
      referralSource: "Instagram",
    },
  });

  // Relacionar bebé con padre
  await prisma.babyParent.upsert({
    where: {
      babyId_parentId: {
        babyId: testBaby.id,
        parentId: testParent.id,
      },
    },
    update: {},
    create: {
      babyId: testBaby.id,
      parentId: testParent.id,
      relationship: "MOTHER",
      isPrimary: true,
    },
  });

  console.log("Test baby created:", testBaby.name);

  // ============================================================
  // PAQUETES
  // ============================================================
  console.log("Creating packages...");

  const packages = [
    {
      name: "Individual",
      namePortuguese: "Individual",
      description: "Sesión individual de hidroterapia",
      sessionCount: 1,
      basePrice: 150,
      sortOrder: 1,
    },
    {
      name: "Mini",
      namePortuguese: "Mini",
      description: "Paquete de 4 sesiones",
      sessionCount: 4,
      basePrice: 550,
      sortOrder: 2,
    },
    {
      name: "Estándar",
      namePortuguese: "Padrão",
      description: "Paquete de 8 sesiones",
      sessionCount: 8,
      basePrice: 1000,
      sortOrder: 3,
    },
    {
      name: "Plus",
      namePortuguese: "Plus",
      description: "Paquete de 10 sesiones",
      sessionCount: 10,
      basePrice: 1200,
      sortOrder: 4,
    },
    {
      name: "Premium",
      namePortuguese: "Premium",
      description: "Paquete de 20 sesiones",
      sessionCount: 20,
      basePrice: 2200,
      sortOrder: 5,
    },
  ];

  for (const pkg of packages) {
    await prisma.package.upsert({
      where: { id: `pkg-${pkg.sessionCount}` },
      update: {},
      create: {
        id: `pkg-${pkg.sessionCount}`,
        ...pkg,
      },
    });
  }

  console.log("Packages created:", packages.length);

  // ============================================================
  // HORARIOS DE ATENCIÓN
  // ============================================================
  console.log("Creating business hours...");

  const businessHours = [
    { dayOfWeek: 0, isOpen: false }, // Domingo - Cerrado
    {
      dayOfWeek: 1,
      isOpen: true,
      morningOpen: "09:00",
      morningClose: "12:00",
      afternoonOpen: "14:00",
      afternoonClose: "19:00",
    },
    {
      dayOfWeek: 2,
      isOpen: true,
      morningOpen: "09:00",
      morningClose: "12:00",
      afternoonOpen: "14:00",
      afternoonClose: "19:00",
    },
    {
      dayOfWeek: 3,
      isOpen: true,
      morningOpen: "09:00",
      morningClose: "12:00",
      afternoonOpen: "14:00",
      afternoonClose: "19:00",
    },
    {
      dayOfWeek: 4,
      isOpen: true,
      morningOpen: "09:00",
      morningClose: "12:00",
      afternoonOpen: "14:00",
      afternoonClose: "19:00",
    },
    {
      dayOfWeek: 5,
      isOpen: true,
      morningOpen: "09:00",
      morningClose: "12:00",
      afternoonOpen: "14:00",
      afternoonClose: "19:00",
    },
    {
      dayOfWeek: 6,
      isOpen: true,
      morningOpen: "09:00",
      morningClose: "13:00",
    }, // Sábado - Solo mañana
  ];

  for (const hours of businessHours) {
    const timeToDate = (time: string | undefined) => {
      if (!time) return null;
      const [h, m] = time.split(":").map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      return date;
    };

    await prisma.businessHours.upsert({
      where: { dayOfWeek: hours.dayOfWeek },
      update: {},
      create: {
        dayOfWeek: hours.dayOfWeek,
        isOpen: hours.isOpen,
        morningOpen: timeToDate(hours.morningOpen),
        morningClose: timeToDate(hours.morningClose),
        afternoonOpen: timeToDate(hours.afternoonOpen),
        afternoonClose: timeToDate(hours.afternoonClose),
      },
    });
  }

  console.log("Business hours created");

  // ============================================================
  // PRODUCTOS DE INVENTARIO
  // ============================================================
  console.log("Creating products...");

  const products = [
    {
      name: "Pañal para piscina",
      namePortuguese: "Fralda de piscina",
      category: "Pañales",
      costPrice: 15,
      salePrice: 25,
      currentStock: 100,
      minStock: 20,
    },
    {
      name: "Crema hidratante bebé",
      namePortuguese: "Creme hidratante bebê",
      category: "Cuidado personal",
      costPrice: 35,
      salePrice: 60,
      currentStock: 30,
      minStock: 10,
    },
    {
      name: "Aceite de masaje",
      namePortuguese: "Óleo de massagem",
      category: "Terapia",
      costPrice: 25,
      salePrice: 45,
      currentStock: 25,
      minStock: 8,
    },
    {
      name: "Toalla pequeña",
      namePortuguese: "Toalha pequena",
      category: "Textiles",
      costPrice: 20,
      salePrice: 35,
      currentStock: 50,
      minStock: 15,
    },
    {
      name: "Gorro de natación bebé",
      namePortuguese: "Touca de natação bebê",
      category: "Accesorios",
      costPrice: 18,
      salePrice: 30,
      currentStock: 40,
      minStock: 10,
    },
  ];

  for (let i = 0; i < products.length; i++) {
    await prisma.product.upsert({
      where: { id: `prod-${i + 1}` },
      update: {},
      create: {
        id: `prod-${i + 1}`,
        ...products[i],
      },
    });
  }

  console.log("Products created:", products.length);

  // ============================================================
  // CONFIGURACIÓN DEL SISTEMA
  // ============================================================
  console.log("Creating system config...");

  const configs = [
    {
      key: "session_duration_minutes",
      value: "45",
      description: "Duración de cada sesión en minutos",
    },
    {
      key: "max_concurrent_sessions",
      value: "3",
      description: "Máximo de sesiones simultáneas",
    },
    {
      key: "no_show_penalty_threshold",
      value: "2",
      description: "Número de faltas para requerir prepago",
    },
    {
      key: "waitlist_expiry_hours",
      value: "24",
      description: "Horas para expirar un item de lista de espera",
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log("System config created");

  console.log("\n========================================");
  console.log("SEED COMPLETED SUCCESSFULLY!");
  console.log("========================================");
  console.log("\nCredenciales de acceso:");
  console.log("----------------------------------------");
  console.log("ADMIN:       admin / admin123");
  console.log("RECEPCIÓN:   recepcion / recep123");
  console.log("TERAPEUTA 1: terapeuta1 / terapeuta123");
  console.log("TERAPEUTA 2: terapeuta2 / terapeuta123");
  console.log("----------------------------------------");
  console.log("PORTAL PADRES: BSB-TEST1");
  console.log("========================================\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
