import { PrismaClient, UserRole, Gender, BirthType, MovementType, CategoryType, RewardType } from "@prisma/client";
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

    const ownerPassword = await hash("owner123", 12);
    const adminPassword = await hash("admin123", 12);
    const recepPassword = await hash("recep123", 12);
    const therapistPassword = await hash("terapeuta123", 12);

    await prisma.user.createMany({
      data: [
        {
          username: "owner",
          email: "owner@babyspa.com",
          passwordHash: ownerPassword,
          name: "Propietario",
          role: UserRole.OWNER,
          phone: "+591 70000000",
          baseSalary: null, // Owner no tiene salario base
          mustChangePassword: false, // Usuario de prueba
        },
        {
          username: "admin",
          email: "admin@babyspa.com",
          passwordHash: adminPassword,
          name: "Administrador",
          role: UserRole.ADMIN,
          phone: "+591 70000001",
          baseSalary: 5000,
          mustChangePassword: false, // Usuario de prueba
        },
        {
          username: "recepcion",
          email: "recepcion@babyspa.com",
          passwordHash: recepPassword,
          name: "María García",
          role: UserRole.RECEPTION,
          phone: "+591 70000002",
          baseSalary: 2500,
          mustChangePassword: false, // Usuario de prueba
        },
        {
          username: "terapeuta1",
          email: "terapeuta1@babyspa.com",
          passwordHash: therapistPassword,
          name: "Ana Rodríguez",
          role: UserRole.THERAPIST,
          phone: "+591 70000003",
          baseSalary: 3000,
          mustChangePassword: false, // Usuario de prueba
        },
        {
          username: "terapeuta2",
          email: "terapeuta2@babyspa.com",
          passwordHash: therapistPassword,
          name: "Carlos López",
          role: UserRole.THERAPIST,
          phone: "+591 70000004",
          baseSalary: 3000,
          mustChangePassword: false, // Usuario de prueba
        },
      ],
    });

    console.log("   ✅ 5 users created (1 owner, 1 admin, 1 reception, 2 therapists)");
  } else {
    console.log(`👤 Users table already has ${existingUsers} records - skipping`);
  }

  // ============================================================
  // CATEGORÍAS - Create categories first (for packages and products)
  // ============================================================
  const existingCategories = await prisma.category.count();

  if (existingCategories === 0) {
    console.log("🏷️  Creating categories...");

    // Package categories
    await prisma.category.createMany({
      data: [
        {
          name: "Hidroterapia",
          description: "Sesiones de hidroterapia y estimulación acuática",
          type: CategoryType.PACKAGE,
          color: "teal",
          sortOrder: 0,
        },
        {
          name: "Cumple Mes",
          description: "Celebraciones especiales de cumple mes",
          type: CategoryType.PACKAGE,
          color: "pink",
          sortOrder: 1,
        },
        {
          name: "Vacunas",
          description: "Servicios de vacunación para bebés",
          type: CategoryType.PACKAGE,
          color: "amber",
          sortOrder: 2,
        },
        // Product categories
        {
          name: "Pañales",
          description: "Pañales para piscina en diferentes tallas",
          type: CategoryType.PRODUCT,
          color: "blue",
          sortOrder: 0,
        },
        {
          name: "Aceites",
          description: "Aceites para masajes y cuidado del bebé",
          type: CategoryType.PRODUCT,
          color: "amber",
          sortOrder: 1,
        },
        {
          name: "Cremas",
          description: "Cremas hidratantes y de cuidado",
          type: CategoryType.PRODUCT,
          color: "pink",
          sortOrder: 2,
        },
        {
          name: "Toallas",
          description: "Toallas y textiles para bebé",
          type: CategoryType.PRODUCT,
          color: "cyan",
          sortOrder: 3,
        },
        {
          name: "Accesorios",
          description: "Accesorios de natación y flotadores",
          type: CategoryType.PRODUCT,
          color: "purple",
          sortOrder: 4,
        },
        {
          name: "Otros",
          description: "Otros productos varios",
          type: CategoryType.PRODUCT,
          color: "gray",
          sortOrder: 5,
        },
      ],
    });

    console.log("   ✅ 9 categories created (3 for packages, 6 for products)");
  } else {
    console.log(`🏷️  Categories table already has ${existingCategories} records - skipping`);
  }

  // ============================================================
  // PAQUETES - Check if table is empty
  // ============================================================
  const existingPackages = await prisma.package.count();

  if (existingPackages === 0) {
    console.log("📦 Creating packages...");

    // Get category IDs
    const hidroterapiaCat = await prisma.category.findFirst({
      where: { name: "Hidroterapia", type: CategoryType.PACKAGE },
    });
    const cumpleMesCat = await prisma.category.findFirst({
      where: { name: "Cumple Mes", type: CategoryType.PACKAGE },
    });
    const vacunasCat = await prisma.category.findFirst({
      where: { name: "Vacunas", type: CategoryType.PACKAGE },
    });

    await prisma.package.createMany({
      data: [
        // HIDROTERAPIA packages (incluye sesión individual)
        {
          name: "Sesión Individual",
          description: "Una sesión de hidroterapia para tu bebé. Ideal para probar nuestros servicios o visitas ocasionales.",
          categoryId: hidroterapiaCat?.id,
          sessionCount: 1,
          basePrice: 150,
          duration: 60,
          requiresAdvancePayment: false,
          advancePaymentAmount: null,
          sortOrder: 0,
        },
        {
          name: "Mini (4 sesiones)",
          description: "Paquete de 4 sesiones de hidroterapia. Perfecto para comenzar con un compromiso menor.",
          categoryId: hidroterapiaCat?.id,
          sessionCount: 4,
          basePrice: 550,
          duration: 60,
          requiresAdvancePayment: false,
          advancePaymentAmount: null,
          sortOrder: 1,
        },
        {
          name: "Estándar (8 sesiones)",
          description: "Paquete de 8 sesiones de hidroterapia. Ideal para un mes de tratamiento.",
          categoryId: hidroterapiaCat?.id,
          sessionCount: 8,
          basePrice: 1000,
          duration: 60,
          requiresAdvancePayment: false,
          advancePaymentAmount: null,
          sortOrder: 2,
        },
        {
          name: "Plus (10 sesiones)",
          description: "Paquete de 10 sesiones de hidroterapia. El más popular entre nuestros clientes.",
          categoryId: hidroterapiaCat?.id,
          sessionCount: 10,
          basePrice: 1200,
          duration: 60,
          requiresAdvancePayment: false,
          advancePaymentAmount: null,
          sortOrder: 3,
        },
        {
          name: "Premium (20 sesiones)",
          description: "Paquete de 20 sesiones de hidroterapia. Máximo ahorro para clientes frecuentes y casos terapéuticos.",
          categoryId: hidroterapiaCat?.id,
          sessionCount: 20,
          basePrice: 2200,
          duration: 60,
          requiresAdvancePayment: false,
          advancePaymentAmount: null,
          sortOrder: 4,
        },
        // CUMPLE_MES packages
        {
          name: "Cumple Mes Básico",
          description: "Celebra el cumple mes de tu bebé con una sesión especial de 90 minutos. Incluye decoración básica.",
          categoryId: cumpleMesCat?.id,
          sessionCount: 1,
          basePrice: 250,
          duration: 90,
          requiresAdvancePayment: true,
          advancePaymentAmount: 100,
          sortOrder: 10,
        },
        {
          name: "Cumple Mes Premium",
          description: "La experiencia completa de cumple mes: 2 horas con fotos profesionales y decoración premium.",
          categoryId: cumpleMesCat?.id,
          sessionCount: 1,
          basePrice: 450,
          duration: 120,
          requiresAdvancePayment: true,
          advancePaymentAmount: 200,
          sortOrder: 11,
        },
        // VACUNAS packages
        {
          name: "Vacuna + Hidroterapia",
          description: "Sesión de vacunación combinada con hidroterapia relajante para calmar al bebé después.",
          categoryId: vacunasCat?.id,
          sessionCount: 1,
          basePrice: 180,
          duration: 45,
          requiresAdvancePayment: true,
          advancePaymentAmount: 50,
          sortOrder: 20,
        },
      ],
    });

    console.log("   ✅ 8 packages created (5 hidroterapia + 2 cumple mes + 1 vacunas)");
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

    // Get category IDs for products
    const panalesCat = await prisma.category.findFirst({
      where: { name: "Pañales", type: CategoryType.PRODUCT },
    });
    const aceitesCat = await prisma.category.findFirst({
      where: { name: "Aceites", type: CategoryType.PRODUCT },
    });
    const cremasCat = await prisma.category.findFirst({
      where: { name: "Cremas", type: CategoryType.PRODUCT },
    });
    const toallasCat = await prisma.category.findFirst({
      where: { name: "Toallas", type: CategoryType.PRODUCT },
    });
    const accesoriosCat = await prisma.category.findFirst({
      where: { name: "Accesorios", type: CategoryType.PRODUCT },
    });
    const otrosCat = await prisma.category.findFirst({
      where: { name: "Otros", type: CategoryType.PRODUCT },
    });

    const products = [
      // PAÑALES
      {
        name: "Pañal para piscina Talla S",
        categoryId: panalesCat?.id,
        costPrice: 12,
        salePrice: 20,
        currentStock: 50,
        minStock: 15,
        isChargeableByDefault: true,
      },
      {
        name: "Pañal para piscina Talla M",
        categoryId: panalesCat?.id,
        costPrice: 14,
        salePrice: 22,
        currentStock: 60,
        minStock: 20,
        isChargeableByDefault: true,
      },
      {
        name: "Pañal para piscina Talla L",
        categoryId: panalesCat?.id,
        costPrice: 16,
        salePrice: 25,
        currentStock: 40,
        minStock: 15,
        isChargeableByDefault: true,
      },
      // ACEITES
      {
        name: "Aceite de masaje relajante",
        categoryId: aceitesCat?.id,
        costPrice: 25,
        salePrice: 45,
        currentStock: 20,
        minStock: 8,
        isChargeableByDefault: false,
      },
      {
        name: "Aceite de almendras para bebé",
        categoryId: aceitesCat?.id,
        costPrice: 30,
        salePrice: 55,
        currentStock: 15,
        minStock: 5,
        isChargeableByDefault: false,
      },
      // CREMAS
      {
        name: "Crema hidratante hipoalergénica",
        categoryId: cremasCat?.id,
        costPrice: 35,
        salePrice: 60,
        currentStock: 25,
        minStock: 10,
        isChargeableByDefault: true,
      },
      {
        name: "Crema para dermatitis",
        categoryId: cremasCat?.id,
        costPrice: 45,
        salePrice: 75,
        currentStock: 10,
        minStock: 5,
        isChargeableByDefault: true,
      },
      // TOALLAS
      {
        name: "Toalla pequeña de algodón",
        categoryId: toallasCat?.id,
        costPrice: 15,
        salePrice: 30,
        currentStock: 40,
        minStock: 15,
        isChargeableByDefault: false,
      },
      {
        name: "Toalla grande con capucha",
        categoryId: toallasCat?.id,
        costPrice: 35,
        salePrice: 65,
        currentStock: 20,
        minStock: 8,
        isChargeableByDefault: true,
      },
      // ACCESORIOS
      {
        name: "Gorro de natación bebé",
        categoryId: accesoriosCat?.id,
        costPrice: 18,
        salePrice: 35,
        currentStock: 30,
        minStock: 10,
        isChargeableByDefault: true,
      },
      {
        name: "Flotador de cuello",
        categoryId: accesoriosCat?.id,
        costPrice: 80,
        salePrice: 150,
        currentStock: 8,
        minStock: 3,
        isChargeableByDefault: false,
      },
      {
        name: "Juguetes para piscina (set)",
        categoryId: accesoriosCat?.id,
        costPrice: 25,
        salePrice: 45,
        currentStock: 12,
        minStock: 5,
        isChargeableByDefault: false,
      },
      // OTROS
      {
        name: "Bolsa impermeable",
        categoryId: otrosCat?.id,
        costPrice: 20,
        salePrice: 40,
        currentStock: 15,
        minStock: 5,
        isChargeableByDefault: true,
      },
      {
        name: "Jabón líquido neutro",
        categoryId: otrosCat?.id,
        costPrice: 12,
        salePrice: 25,
        currentStock: 20,
        minStock: 8,
        isChargeableByDefault: false,
      },
    ];

    for (const product of products) {
      const createdProduct = await prisma.product.create({
        data: {
          name: product.name,
          categoryId: product.categoryId,
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          currentStock: product.currentStock,
          minStock: product.minStock,
          isChargeableByDefault: product.isChargeableByDefault,
        },
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
  // BABY CARD (Plantilla de Fidelización) - Check if table is empty
  // ============================================================
  const existingBabyCards = await prisma.babyCard.count();

  if (existingBabyCards === 0) {
    console.log("🎴 Creating Baby Card template...");

    // Get individual session package for special pricing
    const individualPackage = await prisma.package.findFirst({
      where: { name: "Sesión Individual" },
    });

    // Create Baby Card template
    const babyCard = await prisma.babyCard.create({
      data: {
        name: "Baby Spa Card",
        description: "Tarjeta de fidelización Baby Spa. Incluye primera sesión con descuento especial, precios preferenciales en todas las sesiones individuales y premios desbloqueables a medida que completes sesiones.",
        price: 100, // Precio de la tarjeta
        totalSessions: 24, // 24 sesiones para completar
        firstSessionDiscount: 100, // Primera sesión gratis (100 Bs de descuento)
        isActive: true,
        sortOrder: 0,
      },
    });

    // Create special price for individual sessions (if package exists)
    if (individualPackage) {
      await prisma.babyCardSpecialPrice.create({
        data: {
          babyCardId: babyCard.id,
          packageId: individualPackage.id,
          specialPrice: 120, // Precio especial: 120 Bs en lugar de 150 Bs
        },
      });
      console.log("   ✅ Special price created: Sesión Individual → 120 Bs");
    }

    // Create rewards at different session milestones
    const rewards = [
      {
        sessionNumber: 5,
        rewardType: RewardType.CUSTOM,
        displayName: "🎨 Sesión de Pintura con Piecitos",
        displayIcon: "Palette",
        customName: "Pintura con Piecitos",
        customDescription: "Actividad especial donde el bebé crea arte con sus piecitos. Incluye materiales y cuadro enmarcado.",
      },
      {
        sessionNumber: 10,
        rewardType: RewardType.SERVICE,
        displayName: "🎁 Sesión Individual Gratis",
        displayIcon: "Gift",
        packageId: individualPackage?.id || null,
      },
      {
        sessionNumber: 15,
        rewardType: RewardType.CUSTOM,
        displayName: "📸 Sesión de Fotos Acuáticas",
        displayIcon: "Camera",
        customName: "Fotos Acuáticas",
        customDescription: "Sesión fotográfica profesional del bebé en la piscina. Incluye 10 fotos editadas en alta resolución.",
      },
      {
        sessionNumber: 20,
        rewardType: RewardType.SERVICE,
        displayName: "🏆 Sesión Individual Gratis",
        displayIcon: "Trophy",
        packageId: individualPackage?.id || null,
      },
      {
        sessionNumber: 24,
        rewardType: RewardType.CUSTOM,
        displayName: "🎓 Diploma de Graduación Baby Spa",
        displayIcon: "GraduationCap",
        customName: "Graduación Baby Spa",
        customDescription: "Diploma oficial de graduación Baby Spa + Sesión especial de celebración + Fotos + Regalo sorpresa.",
      },
    ];

    for (const reward of rewards) {
      await prisma.babyCardReward.create({
        data: {
          babyCardId: babyCard.id,
          sessionNumber: reward.sessionNumber,
          rewardType: reward.rewardType,
          displayName: reward.displayName,
          displayIcon: reward.displayIcon,
          packageId: reward.packageId,
          customName: reward.customName,
          customDescription: reward.customDescription,
        },
      });
    }

    console.log(`   ✅ Baby Card template created with ${rewards.length} rewards`);
  } else {
    console.log(`🎴 BabyCard table already has ${existingBabyCards} records - skipping`);
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
  // SYSTEM SETTINGS - Check if exists
  // ============================================================
  const existingSettings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
  });

  if (!existingSettings) {
    console.log("⚙️ Creating system settings...");

    // Get the Individual package to set as default (Sesión Individual in Hidroterapia category)
    const individualPackage = await prisma.package.findFirst({
      where: { name: "Sesión Individual", sessionCount: 1 },
    });

    await prisma.systemSettings.create({
      data: {
        id: "default",
        defaultPackageId: individualPackage?.id || null,
        paymentQrImageUrl: null,
        whatsappNumber: "+591 70000000",
        whatsappMessage: "Hola Baby Spa! Adjunto mi comprobante de pago para la cita del {fecha} para {bebe}. Monto: {monto}",
      },
    });

    console.log(`   ✅ System settings created (default package: ${individualPackage?.name || "none"})`);
  } else {
    console.log("⚙️ SystemSettings already exists - skipping");
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
    babyCards: await prisma.babyCard.count(),
    babyCardRewards: await prisma.babyCardReward.count(),
    businessHours: await prisma.businessHours.count(),
    systemConfig: await prisma.systemConfig.count(),
    systemSettings: await prisma.systemSettings.count(),
  };

  // Get default package info
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    include: { defaultPackage: true },
  });

  console.log("\n📊 Database Summary:");
  console.log("----------------------------------------");
  console.log(`   Users:             ${finalCounts.users}`);
  console.log(`   Parents:           ${finalCounts.parents}`);
  console.log(`   Babies:            ${finalCounts.babies}`);
  console.log(`   Packages:          ${finalCounts.packages}`);
  console.log(`   Package Purchases: ${finalCounts.packagePurchases}`);
  console.log(`   Products:          ${finalCounts.products}`);
  console.log(`   Baby Cards:        ${finalCounts.babyCards}`);
  console.log(`   Baby Card Rewards: ${finalCounts.babyCardRewards}`);
  console.log(`   Business Hours:    ${finalCounts.businessHours}`);
  console.log(`   System Configs:    ${finalCounts.systemConfig}`);
  console.log(`   System Settings:   ${finalCounts.systemSettings}`);
  console.log("----------------------------------------");
  if (settings?.defaultPackage) {
    console.log(`   📦 Default Package: ${settings.defaultPackage.name}`);
    console.log("----------------------------------------");
  }

  console.log("\n🔐 Credenciales de acceso (Staff):");
  console.log("----------------------------------------");
  console.log("   OWNER:       owner / owner123");
  console.log("   ADMIN:       admin / admin123");
  console.log("   RECEPCIÓN:   recepcion / recep123");
  console.log("   TERAPEUTA 1: terapeuta1 / terapeuta123");
  console.log("   TERAPEUTA 2: terapeuta2 / terapeuta123");
  console.log("----------------------------------------");
  console.log("   ⚠️  Usuarios de prueba: NO requieren cambio de contraseña");
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
