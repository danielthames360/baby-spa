import { PrismaClient, UserRole, Gender, BirthType, MovementType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Helper to generate random access codes
function generateAccessCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "BSB-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to generate random date within a range
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Baby names for seed data
const babyNames = [
  { name: "Mateo García", gender: Gender.MALE },
  { name: "Valentina López", gender: Gender.FEMALE },
  { name: "Santiago Rodríguez", gender: Gender.MALE },
  { name: "Isabella Fernández", gender: Gender.FEMALE },
  { name: "Sebastián Martínez", gender: Gender.MALE },
  { name: "Camila Hernández", gender: Gender.FEMALE },
  { name: "Nicolás Pérez", gender: Gender.MALE },
  { name: "Luciana González", gender: Gender.FEMALE },
  { name: "Diego Sánchez", gender: Gender.MALE },
  { name: "Emma Torres", gender: Gender.FEMALE },
];

// Parent names for seed data
const parentNames = [
  { name: "María García", relationship: "MOTHER" },
  { name: "José López", relationship: "FATHER" },
  { name: "Ana Rodríguez", relationship: "MOTHER" },
  { name: "Carlos Fernández", relationship: "FATHER" },
  { name: "Laura Martínez", relationship: "MOTHER" },
  { name: "Pedro Hernández", relationship: "FATHER" },
  { name: "Carmen Pérez", relationship: "MOTHER" },
  { name: "Miguel González", relationship: "FATHER" },
  { name: "Patricia Sánchez", relationship: "MOTHER" },
  { name: "Roberto Torres", relationship: "FATHER" },
];

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ============================================================
  // USUARIOS (Staff) - Check if table is empty
  // ============================================================
  const existingUsers = await prisma.user.count();

  if (existingUsers === 0) {
    console.log("👤 Creating users...");

    const adminPassword = await hash("admin123", 12);
    const recepPassword = await hash("recep123", 12);
    const therapistPassword = await hash("terapeuta123", 12);

    await prisma.user.createMany({
      data: [
        {
          username: "admin",
          email: "admin@babyspa.com",
          passwordHash: adminPassword,
          name: "Administrador",
          role: UserRole.ADMIN,
          phone: "+591 70000001",
          baseSalary: 5000,
        },
        {
          username: "recepcion",
          email: "recepcion@babyspa.com",
          passwordHash: recepPassword,
          name: "María García",
          role: UserRole.RECEPTION,
          phone: "+591 70000002",
          baseSalary: 2500,
        },
        {
          username: "terapeuta1",
          email: "terapeuta1@babyspa.com",
          passwordHash: therapistPassword,
          name: "Ana Rodríguez",
          role: UserRole.THERAPIST,
          phone: "+591 70000003",
          baseSalary: 3000,
        },
        {
          username: "terapeuta2",
          email: "terapeuta2@babyspa.com",
          passwordHash: therapistPassword,
          name: "Carlos López",
          role: UserRole.THERAPIST,
          phone: "+591 70000004",
          baseSalary: 3000,
        },
      ],
    });

    console.log("   ✅ 4 users created");
  } else {
    console.log(`👤 Users table already has ${existingUsers} records - skipping`);
  }

  // ============================================================
  // PAQUETES - Check if table is empty
  // ============================================================
  const existingPackages = await prisma.package.count();

  if (existingPackages === 0) {
    console.log("📦 Creating packages...");

    await prisma.package.createMany({
      data: [
        // HIDROTERAPIA packages
        {
          name: "Individual",
          description: "Sesión individual de hidroterapia",
          category: "HIDROTERAPIA",
          sessionCount: 1,
          basePrice: 150,
          sortOrder: 1,
        },
        {
          name: "Mini",
          description: "Paquete de 4 sesiones de hidroterapia",
          category: "HIDROTERAPIA",
          sessionCount: 4,
          basePrice: 550,
          sortOrder: 2,
        },
        {
          name: "Estándar",
          description: "Paquete de 8 sesiones de hidroterapia",
          category: "HIDROTERAPIA",
          sessionCount: 8,
          basePrice: 1000,
          sortOrder: 3,
        },
        {
          name: "Plus",
          description: "Paquete de 10 sesiones de hidroterapia - El más popular",
          category: "HIDROTERAPIA",
          sessionCount: 10,
          basePrice: 1200,
          sortOrder: 4,
        },
        {
          name: "Premium",
          description: "Paquete de 20 sesiones de hidroterapia",
          category: "HIDROTERAPIA",
          sessionCount: 20,
          basePrice: 2200,
          sortOrder: 5,
        },
        // CUMPLE_MES packages
        {
          name: "Cumple Mes Individual",
          description: "Sesión especial de cumple mes para tu bebé",
          category: "CUMPLE_MES",
          sessionCount: 1,
          basePrice: 180,
          sortOrder: 10,
        },
        {
          name: "Cumple Mes Mensual",
          description: "4 sesiones de cumple mes (un mes completo)",
          category: "CUMPLE_MES",
          sessionCount: 4,
          basePrice: 650,
          sortOrder: 11,
        },
        // GRUPAL packages
        {
          name: "Grupal Individual",
          description: "Sesión grupal de hidroterapia",
          category: "GRUPAL",
          sessionCount: 1,
          basePrice: 100,
          sortOrder: 20,
        },
        {
          name: "Grupal Mensual",
          description: "4 sesiones grupales (un mes completo)",
          category: "GRUPAL",
          sessionCount: 4,
          basePrice: 350,
          sortOrder: 21,
        },
      ],
    });

    console.log("   ✅ 9 packages created (5 hidroterapia + 2 cumple mes + 2 grupal)");
  } else {
    console.log(`📦 Packages table already has ${existingPackages} records - skipping`);
  }

  // ============================================================
  // PADRES Y BEBÉS - Check if tables are empty
  // ============================================================
  const existingBabies = await prisma.baby.count();
  const existingParents = await prisma.parent.count();

  if (existingBabies === 0 && existingParents === 0) {
    console.log("👶 Creating babies and parents...");

    // Get the Plus package (10 sessions) for assigning to babies
    const plusPackage = await prisma.package.findFirst({
      where: { sessionCount: 10 },
    });

    if (!plusPackage) {
      console.log("   ⚠️ Plus package not found - creating packages first");
    }

    // Date range for baby birthdays (0-36 months old)
    const today = new Date();
    const threeYearsAgo = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate());

    for (let i = 0; i < 10; i++) {
      // Create parent
      const parent = await prisma.parent.create({
        data: {
          phone: `+591 7${String(i + 1).padStart(7, "0")}`,
          name: parentNames[i].name,
          email: `parent${i + 1}@example.com`,
          accessCode: generateAccessCode(),
        },
      });

      // Create baby
      const birthDate = randomDate(threeYearsAgo, today);
      const baby = await prisma.baby.create({
        data: {
          name: babyNames[i].name,
          birthDate,
          gender: babyNames[i].gender,
          birthWeeks: Math.floor(Math.random() * 5) + 37, // 37-41 weeks
          birthWeight: Math.round((Math.random() * 1.5 + 2.5) * 10) / 10, // 2.5-4.0 kg
          birthType: Math.random() > 0.3 ? BirthType.NATURAL : BirthType.CESAREAN,
          socialMediaConsent: Math.random() > 0.3,
          referralSource: ["Instagram", "Facebook", "Recomendación", "Google", "Otros"][
            Math.floor(Math.random() * 5)
          ],
        },
      });

      // Link baby to parent
      await prisma.babyParent.create({
        data: {
          babyId: baby.id,
          parentId: parent.id,
          relationship: parentNames[i].relationship,
          isPrimary: true,
        },
      });

      // Create package purchase for the baby (Plus package - 10 sessions)
      if (plusPackage) {
        const usedSessions = Math.floor(Math.random() * 5); // 0-4 sessions used
        await prisma.packagePurchase.create({
          data: {
            babyId: baby.id,
            packageId: plusPackage.id,
            totalSessions: plusPackage.sessionCount,
            usedSessions,
            remainingSessions: plusPackage.sessionCount - usedSessions,
            basePrice: plusPackage.basePrice,
            discountAmount: 0,
            finalPrice: plusPackage.basePrice,
            isActive: true,
          },
        });
      }

      console.log(`   ✅ Created: ${baby.name} with parent ${parent.name} (${parent.accessCode})`);
    }

    console.log("   ✅ 10 babies with parents and packages created");
  } else {
    console.log(`👶 Babies table already has ${existingBabies} records - skipping`);
    console.log(`👨‍👩‍👧 Parents table already has ${existingParents} records - skipping`);
  }

  // ============================================================
  // PRODUCTOS DE INVENTARIO - Check if table is empty
  // ============================================================
  const existingProducts = await prisma.product.count();

  if (existingProducts === 0) {
    console.log("📦 Creating inventory products...");

    const products = [
      // DIAPERS
      {
        name: "Pañal para piscina Talla S",
        category: "DIAPERS",
        costPrice: 12,
        salePrice: 20,
        currentStock: 50,
        minStock: 15,
        isChargeableByDefault: true,
      },
      {
        name: "Pañal para piscina Talla M",
        category: "DIAPERS",
        costPrice: 14,
        salePrice: 22,
        currentStock: 60,
        minStock: 20,
        isChargeableByDefault: true,
      },
      {
        name: "Pañal para piscina Talla L",
        category: "DIAPERS",
        costPrice: 16,
        salePrice: 25,
        currentStock: 40,
        minStock: 15,
        isChargeableByDefault: true,
      },
      // OILS
      {
        name: "Aceite de masaje relajante",
        category: "OILS",
        costPrice: 25,
        salePrice: 45,
        currentStock: 20,
        minStock: 8,
        isChargeableByDefault: false,
      },
      {
        name: "Aceite de almendras para bebé",
        category: "OILS",
        costPrice: 30,
        salePrice: 55,
        currentStock: 15,
        minStock: 5,
        isChargeableByDefault: false,
      },
      // CREAMS
      {
        name: "Crema hidratante hipoalergénica",
        category: "CREAMS",
        costPrice: 35,
        salePrice: 60,
        currentStock: 25,
        minStock: 10,
        isChargeableByDefault: true,
      },
      {
        name: "Crema para dermatitis",
        category: "CREAMS",
        costPrice: 45,
        salePrice: 75,
        currentStock: 10,
        minStock: 5,
        isChargeableByDefault: true,
      },
      // TOWELS
      {
        name: "Toalla pequeña de algodón",
        category: "TOWELS",
        costPrice: 15,
        salePrice: 30,
        currentStock: 40,
        minStock: 15,
        isChargeableByDefault: false,
      },
      {
        name: "Toalla grande con capucha",
        category: "TOWELS",
        costPrice: 35,
        salePrice: 65,
        currentStock: 20,
        minStock: 8,
        isChargeableByDefault: true,
      },
      // ACCESSORIES
      {
        name: "Gorro de natación bebé",
        category: "ACCESSORIES",
        costPrice: 18,
        salePrice: 35,
        currentStock: 30,
        minStock: 10,
        isChargeableByDefault: true,
      },
      {
        name: "Flotador de cuello",
        category: "ACCESSORIES",
        costPrice: 80,
        salePrice: 150,
        currentStock: 8,
        minStock: 3,
        isChargeableByDefault: false,
      },
      {
        name: "Juguetes para piscina (set)",
        category: "ACCESSORIES",
        costPrice: 25,
        salePrice: 45,
        currentStock: 12,
        minStock: 5,
        isChargeableByDefault: false,
      },
      // OTHER
      {
        name: "Bolsa impermeable",
        category: "OTHER",
        costPrice: 20,
        salePrice: 40,
        currentStock: 15,
        minStock: 5,
        isChargeableByDefault: true,
      },
      {
        name: "Jabón líquido neutro",
        category: "OTHER",
        costPrice: 12,
        salePrice: 25,
        currentStock: 20,
        minStock: 8,
        isChargeableByDefault: false,
      },
    ];

    for (const product of products) {
      const createdProduct = await prisma.product.create({
        data: product,
      });

      // Create initial stock movement
      await prisma.inventoryMovement.create({
        data: {
          productId: createdProduct.id,
          type: MovementType.PURCHASE,
          quantity: product.currentStock,
          unitPrice: product.costPrice,
          totalAmount: product.costPrice * product.currentStock,
          stockAfter: product.currentStock,
          notes: "Stock inicial",
        },
      });
    }

    console.log(`   ✅ ${products.length} products created with initial stock movements`);
  } else {
    console.log(`📦 Products table already has ${existingProducts} records - skipping`);
  }

  // ============================================================
  // HORARIOS DE ATENCIÓN - Check if table is empty
  // ============================================================
  const existingHours = await prisma.businessHours.count();

  if (existingHours === 0) {
    console.log("🕐 Creating business hours...");

    await prisma.businessHours.createMany({
      data: [
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
      ],
    });

    console.log("   ✅ Business hours created (Mon-Sat)");
  } else {
    console.log(`🕐 BusinessHours table already has ${existingHours} records - skipping`);
  }

  // ============================================================
  // CONFIGURACIÓN DEL SISTEMA - Check if table is empty
  // ============================================================
  const existingConfigs = await prisma.systemConfig.count();

  if (existingConfigs === 0) {
    console.log("⚙️ Creating system config...");

    await prisma.systemConfig.createMany({
      data: [
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
        {
          key: "currency",
          value: "BOB",
          description: "Moneda del sistema (BOB o BRL)",
        },
      ],
    });

    console.log("   ✅ System config created");
  } else {
    console.log(`⚙️ SystemConfig table already has ${existingConfigs} records - skipping`);
  }

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  console.log("\n========================================");
  console.log("🎉 SEED COMPLETED SUCCESSFULLY!");
  console.log("========================================");

  // Get final counts
  const finalCounts = {
    users: await prisma.user.count(),
    parents: await prisma.parent.count(),
    babies: await prisma.baby.count(),
    packages: await prisma.package.count(),
    packagePurchases: await prisma.packagePurchase.count(),
    products: await prisma.product.count(),
    businessHours: await prisma.businessHours.count(),
    systemConfig: await prisma.systemConfig.count(),
  };

  console.log("\n📊 Database Summary:");
  console.log("----------------------------------------");
  console.log(`   Users:            ${finalCounts.users}`);
  console.log(`   Parents:          ${finalCounts.parents}`);
  console.log(`   Babies:           ${finalCounts.babies}`);
  console.log(`   Packages:         ${finalCounts.packages}`);
  console.log(`   Package Purchases: ${finalCounts.packagePurchases}`);
  console.log(`   Products:         ${finalCounts.products}`);
  console.log(`   Business Hours:   ${finalCounts.businessHours}`);
  console.log(`   System Configs:   ${finalCounts.systemConfig}`);
  console.log("----------------------------------------");

  console.log("\n🔐 Credenciales de acceso (Staff):");
  console.log("----------------------------------------");
  console.log("   ADMIN:       admin / admin123");
  console.log("   RECEPCIÓN:   recepcion / recep123");
  console.log("   TERAPEUTA 1: terapeuta1 / terapeuta123");
  console.log("   TERAPEUTA 2: terapeuta2 / terapeuta123");
  console.log("----------------------------------------");

  // List parent access codes
  const parents = await prisma.parent.findMany({
    select: { name: true, accessCode: true },
    take: 10,
  });

  console.log("\n👨‍👩‍👧 Códigos de acceso (Portal Padres):");
  console.log("----------------------------------------");
  for (const parent of parents) {
    console.log(`   ${parent.name}: ${parent.accessCode}`);
  }
  console.log("========================================\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
