/**
 * Seed de prueba para validar Transaction + TransactionItem
 * Genera datos para probar todos los reportes
 *
 * Ejecutar: node scripts/seed-test-transactions.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Helper para crear fecha UTC noon
function createUTCNoon(year, month, day) {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

// Helper para fecha aleatoria en rango
function randomDate(startDate, endDate) {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  const date = new Date(randomTime);
  return createUTCNoon(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}

// Helper para elemento aleatorio
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Iniciando seed de prueba para Transaction...\n');

  // Limpiar datos existentes (en orden correcto por FKs)
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.sessionProduct.deleteMany();
  await prisma.session.deleteMany();
  await prisma.appointmentHistory.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.packagePurchase.deleteMany();
  await prisma.babyCardSessionLog.deleteMany();
  await prisma.babyCardRewardUsage.deleteMany();
  await prisma.babyCardPurchase.deleteMany();
  await prisma.babyCardReward.deleteMany();
  await prisma.babyCard.deleteMany();
  await prisma.eventProductUsage.deleteMany();
  await prisma.eventParticipant.deleteMany();
  await prisma.event.deleteMany();
  await prisma.babyNote.deleteMany();
  await prisma.babyParent.deleteMany();
  await prisma.baby.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.package.deleteMany();
  await prisma.category.deleteMany();
  await prisma.staffPayment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.cashRegisterExpense.deleteMany();
  await prisma.cashRegister.deleteMany();
  // NO eliminamos usuarios para preservar la sesión activa
  console.log('✅ Datos limpiados\n');

  // ============================================================
  // 1. USUARIOS (upsert para preservar sesión)
  // ============================================================
  console.log('👤 Creando/actualizando usuarios...');
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: { isActive: true },
    create: {
      username: 'admin',
      email: 'admin@babyspa.com',
      passwordHash: hashedPassword,
      name: 'Admin Principal',
      role: 'OWNER',
      isActive: true,
      mustChangePassword: false,
    },
  });

  const therapist1 = await prisma.user.upsert({
    where: { username: 'maria' },
    update: { isActive: true, baseSalary: 3000 },
    create: {
      username: 'maria',
      email: 'maria@babyspa.com',
      passwordHash: hashedPassword,
      name: 'María García',
      role: 'THERAPIST',
      isActive: true,
      mustChangePassword: false,
      baseSalary: 3000,
    },
  });

  const therapist2 = await prisma.user.upsert({
    where: { username: 'carmen' },
    update: { isActive: true, baseSalary: 2800 },
    create: {
      username: 'carmen',
      email: 'carmen@babyspa.com',
      passwordHash: hashedPassword,
      name: 'Carmen López',
      role: 'THERAPIST',
      isActive: true,
      mustChangePassword: false,
      baseSalary: 2800,
    },
  });

  const reception = await prisma.user.upsert({
    where: { username: 'recepcion' },
    update: { isActive: true },
    create: {
      username: 'recepcion',
      email: 'recepcion@babyspa.com',
      passwordHash: hashedPassword,
      name: 'Ana Recepción',
      role: 'RECEPTION',
      isActive: true,
      mustChangePassword: false,
    },
  });

  console.log(`   ✅ 4 usuarios listos\n`);

  // ============================================================
  // 2. CATEGORÍAS
  // ============================================================
  console.log('📁 Creando categorías...');
  const catPaquetes = await prisma.category.create({
    data: { name: 'Paquetes Bebé', type: 'PACKAGE' },
  });

  const catProductos = await prisma.category.create({
    data: { name: 'Cuidado Bebé', type: 'PRODUCT' },
  });

  console.log(`   ✅ ${2} categorías creadas\n`);

  // ============================================================
  // 3. PAQUETES
  // ============================================================
  console.log('📦 Creando paquetes...');
  const paquetes = await Promise.all([
    prisma.package.create({
      data: {
        name: 'Sesión Individual',
        description: 'Una sesión de spa para bebé',
        sessionCount: 1,
        basePrice: 150,
        isActive: true,
        categoryRef: { connect: { id: catPaquetes.id } },
        installmentsCount: 1,
        allowInstallments: false,
      },
    }),
    prisma.package.create({
      data: {
        name: 'Paquete Básico',
        description: '4 sesiones de spa',
        sessionCount: 4,
        basePrice: 500,
        isActive: true,
        categoryRef: { connect: { id: catPaquetes.id } },
        installmentsCount: 2,
        allowInstallments: true,
      },
    }),
    prisma.package.create({
      data: {
        name: 'Paquete Premium',
        description: '8 sesiones de spa',
        sessionCount: 8,
        basePrice: 900,
        isActive: true,
        categoryRef: { connect: { id: catPaquetes.id } },
        installmentsCount: 4,
        allowInstallments: true,
      },
    }),
  ]);
  console.log(`   ✅ ${paquetes.length} paquetes creados\n`);

  // ============================================================
  // 4. PRODUCTOS
  // ============================================================
  console.log('🧴 Creando productos...');
  const productos = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Crema Hidratante Bebé',
        description: 'Crema suave para piel de bebé',
        costPrice: 25,
        salePrice: 50,
        currentStock: 50,
        minStock: 10,
        isActive: true,
        categoryRef: { connect: { id: catProductos.id } },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Aceite de Masaje',
        description: 'Aceite natural para masajes',
        costPrice: 30,
        salePrice: 60,
        currentStock: 40,
        minStock: 8,
        isActive: true,
        categoryRef: { connect: { id: catProductos.id } },
      },
    }),
    prisma.product.create({
      data: {
        name: 'Toallitas Premium',
        description: 'Toallitas húmedas hipoalergénicas',
        costPrice: 15,
        salePrice: 35,
        currentStock: 100,
        minStock: 20,
        isActive: true,
        categoryRef: { connect: { id: catProductos.id } },
      },
    }),
  ]);
  console.log(`   ✅ ${productos.length} productos creados\n`);

  // ============================================================
  // 5. PADRES Y BEBÉS
  // ============================================================
  console.log('👨‍👩‍👧 Creando padres y bebés...');
  const parentNames = [
    { name: 'Carlos Mendoza', phone: '71234567', email: 'carlos@email.com' },
    { name: 'Laura Pérez', phone: '72345678', email: 'laura@email.com' },
    { name: 'Roberto Sánchez', phone: '73456789', email: 'roberto@email.com' },
    { name: 'María Rodríguez', phone: '74567890', email: 'maria.r@email.com' },
    { name: 'Jorge Gutiérrez', phone: '75678901', email: 'jorge@email.com' },
  ];

  const babyNames = [
    { name: 'Sofía', gender: 'FEMALE' },
    { name: 'Mateo', gender: 'MALE' },
    { name: 'Valentina', gender: 'FEMALE' },
    { name: 'Santiago', gender: 'MALE' },
    { name: 'Isabella', gender: 'FEMALE' },
  ];

  const parents = [];
  const babies = [];

  for (let i = 0; i < parentNames.length; i++) {
    const accessCode = `BSB-${String(i + 1).padStart(5, '0')}`;
    const parent = await prisma.parent.create({
      data: {
        name: parentNames[i].name,
        phone: parentNames[i].phone,
        email: parentNames[i].email,
        accessCode,
      },
    });
    parents.push(parent);

    // Crear 1 bebé por padre
    const babyData = babyNames[i];
    const birthDate = randomDate(
      createUTCNoon(2024, 1, 1),
      createUTCNoon(2025, 6, 1)
    );

    const baby = await prisma.baby.create({
      data: {
        name: babyData.name,
        birthDate,
        gender: babyData.gender,
        parents: {
          create: {
            parentId: parent.id,
            relationship: 'MOTHER',
            isPrimary: true,
          },
        },
      },
    });
    babies.push(baby);
  }
  console.log(`   ✅ ${parents.length} padres y ${babies.length} bebés creados\n`);

  // ============================================================
  // 6. BABY CARDS
  // ============================================================
  console.log('💳 Creando Baby Cards...');
  const babyCard = await prisma.babyCard.create({
    data: {
      name: 'Baby Card Gold',
      description: 'Tarjeta de fidelidad con beneficios',
      totalSessions: 10,
      price: 200,
      firstSessionDiscount: 50, // Bs. 50 de descuento en primera sesión
      isActive: true,
      rewards: {
        create: [
          { sessionNumber: 5, rewardType: 'CUSTOM', displayName: 'Crema Gratis', customName: 'Crema hidratante', customDescription: 'Una crema hidratante de regalo', displayIcon: '🧴' },
          { sessionNumber: 10, rewardType: 'CUSTOM', displayName: 'Sesión Gratis', customName: 'Sesión de spa', customDescription: 'Una sesión de spa de regalo', displayIcon: '🎁' },
        ],
      },
    },
  });
  console.log(`   ✅ Baby Card creada\n`);

  // ============================================================
  // 7. EVENTOS
  // ============================================================
  console.log('🎉 Creando eventos...');
  const evento = await prisma.event.create({
    data: {
      name: 'Taller de Masaje Infantil',
      description: 'Aprende técnicas de masaje para tu bebé',
      date: createUTCNoon(2026, 2, 10),
      startTime: '10:00',
      endTime: '12:00',
      type: 'PARENTS',
      maxParticipants: 10,
      basePrice: 80,
      status: 'IN_PROGRESS',
      createdById: admin.id,
    },
  });
  console.log(`   ✅ Evento creado\n`);

  // ============================================================
  // 8. COMPRAS DE PAQUETES Y SESIONES
  // ============================================================
  console.log('📝 Creando compras de paquetes y sesiones...');

  const therapists = [therapist1, therapist2];
  const today = createUTCNoon(2026, 2, 5);
  const startOfMonth = createUTCNoon(2026, 2, 1);

  let sessionsCreated = 0;
  let packagesCreated = 0;
  let packageSaleTotal = 0;
  let packageInstallmentTotal = 0;

  // ---- CASO 1: Paquete al CONTADO (sin descuento) ----
  const baby1 = babies[0];
  const pkg1 = paquetes[0]; // Sesión Individual Bs. 150

  const purchase1 = await prisma.packagePurchase.create({
    data: {
      babyId: baby1.id,
      packageId: pkg1.id,
      basePrice: pkg1.basePrice,
      discountAmount: 0,
      finalPrice: Number(pkg1.basePrice),
      totalSessions: pkg1.sessionCount,
      remainingSessions: 0,
      usedSessions: 1,
      isActive: false, // Ya usó todas las sesiones
      paymentPlan: 'SINGLE',
      installments: 1,
      paidAmount: Number(pkg1.basePrice),
    },
  });
  packagesCreated++;

  // Transaction: PACKAGE_SALE (pago completo al vender)
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'PACKAGE_SALE',
      referenceType: 'PackagePurchase',
      referenceId: purchase1.id,
      subtotal: pkg1.basePrice,
      discountTotal: 0,
      total: pkg1.basePrice,
      paymentMethods: [{ method: 'CASH', amount: Number(pkg1.basePrice) }],
      notes: `Venta de ${pkg1.name} - Pago completo`,
      createdById: reception.id,
      createdAt: randomDate(startOfMonth, today),
      items: {
        create: {
          itemType: 'PACKAGE',
          referenceId: pkg1.id,
          description: pkg1.name,
          quantity: 1,
          unitPrice: pkg1.basePrice,
          discountAmount: 0,
          finalPrice: pkg1.basePrice,
        },
      },
    },
  });
  packageSaleTotal += Number(pkg1.basePrice);

  // ---- CASO 2: Paquete al CONTADO con DESCUENTO ----
  const baby2 = babies[1];
  const pkg2 = paquetes[1]; // Paquete Básico Bs. 500
  const discount2 = 50; // 10% descuento

  const purchase2 = await prisma.packagePurchase.create({
    data: {
      babyId: baby2.id,
      packageId: pkg2.id,
      basePrice: pkg2.basePrice,
      discountAmount: discount2,
      discountReason: 'Cliente frecuente - 10% descuento',
      finalPrice: Number(pkg2.basePrice) - discount2,
      totalSessions: pkg2.sessionCount,
      remainingSessions: pkg2.sessionCount - 2,
      usedSessions: 2,
      isActive: true,
      paymentPlan: 'SINGLE',
      installments: 1,
      paidAmount: Number(pkg2.basePrice) - discount2,
    },
  });
  packagesCreated++;

  // Transaction: PACKAGE_SALE con descuento
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'PACKAGE_SALE',
      referenceType: 'PackagePurchase',
      referenceId: purchase2.id,
      subtotal: pkg2.basePrice,
      discountTotal: discount2,
      total: Number(pkg2.basePrice) - discount2,
      paymentMethods: [{ method: 'QR', amount: Number(pkg2.basePrice) - discount2 }],
      notes: `Venta de ${pkg2.name} - Con descuento cliente frecuente`,
      createdById: reception.id,
      createdAt: randomDate(startOfMonth, today),
      items: {
        create: {
          itemType: 'PACKAGE',
          referenceId: pkg2.id,
          description: pkg2.name,
          quantity: 1,
          unitPrice: pkg2.basePrice,
          discountAmount: discount2,
          discountReason: 'Cliente frecuente - 10% descuento',
          finalPrice: Number(pkg2.basePrice) - discount2,
        },
      },
    },
  });
  packageSaleTotal += Number(pkg2.basePrice) - discount2;

  // ---- CASO 3: Paquete a CUOTAS (primera cuota = PACKAGE_SALE) ----
  const baby3 = babies[2];
  const pkg3 = paquetes[2]; // Paquete Premium Bs. 900, 4 cuotas
  const cuota3 = 225; // 900 / 4

  const purchase3 = await prisma.packagePurchase.create({
    data: {
      babyId: baby3.id,
      packageId: pkg3.id,
      basePrice: pkg3.basePrice,
      discountAmount: 0,
      finalPrice: Number(pkg3.basePrice),
      totalSessions: pkg3.sessionCount,
      remainingSessions: pkg3.sessionCount - 2,
      usedSessions: 2,
      isActive: true,
      paymentPlan: 'INSTALLMENTS',
      installments: 4,
      installmentAmount: cuota3,
      paidAmount: cuota3 * 2, // Pagó 2 cuotas
    },
  });
  packagesCreated++;

  // Transaction: PACKAGE_SALE (primera cuota al vender)
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'PACKAGE_SALE',
      referenceType: 'PackagePurchase',
      referenceId: purchase3.id,
      subtotal: cuota3,
      discountTotal: 0,
      total: cuota3,
      paymentMethods: [{ method: 'CASH', amount: cuota3 }],
      notes: `Venta de ${pkg3.name} - Cuota 1 de 4 (inicial)`,
      createdById: reception.id,
      createdAt: createUTCNoon(2026, 2, 1),
      items: {
        create: {
          itemType: 'PACKAGE',
          referenceId: pkg3.id,
          description: `${pkg3.name} - Cuota 1 de 4`,
          quantity: 1,
          unitPrice: cuota3,
          discountAmount: 0,
          finalPrice: cuota3,
        },
      },
    },
  });
  packageSaleTotal += cuota3;

  // Transaction: PACKAGE_INSTALLMENT (segunda cuota)
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'PACKAGE_INSTALLMENT',
      referenceType: 'PackagePurchase',
      referenceId: purchase3.id,
      subtotal: cuota3,
      discountTotal: 0,
      total: cuota3,
      paymentMethods: [{ method: 'TRANSFER', amount: cuota3 }],
      notes: `Cuota 2 de 4 - ${pkg3.name}`,
      createdById: reception.id,
      createdAt: createUTCNoon(2026, 2, 3),
      items: {
        create: {
          itemType: 'INSTALLMENT',
          referenceId: purchase3.id,
          description: `Cuota 2 de 4 - ${pkg3.name}`,
          quantity: 1,
          unitPrice: cuota3,
          discountAmount: 0,
          finalPrice: cuota3,
        },
      },
    },
  });
  packageInstallmentTotal += cuota3;

  // Transaction: PACKAGE_INSTALLMENT (tercera cuota - mismo paquete)
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'PACKAGE_INSTALLMENT',
      referenceType: 'PackagePurchase',
      referenceId: purchase3.id,
      subtotal: cuota3,
      discountTotal: 0,
      total: cuota3,
      paymentMethods: [{ method: 'CASH', amount: cuota3 }],
      notes: `Cuota 3 de 4 - ${pkg3.name}`,
      createdById: reception.id,
      createdAt: createUTCNoon(2026, 2, 4),
      items: {
        create: {
          itemType: 'INSTALLMENT',
          referenceId: purchase3.id,
          description: `Cuota 3 de 4 - ${pkg3.name}`,
          quantity: 1,
          unitPrice: cuota3,
          discountAmount: 0,
          finalPrice: cuota3,
        },
      },
    },
  });
  packageInstallmentTotal += cuota3;

  // Actualizar paidAmount del purchase3 (ahora tiene 3 cuotas pagadas)
  await prisma.packagePurchase.update({
    where: { id: purchase3.id },
    data: { paidAmount: cuota3 * 3 },
  });

  // ---- CASO 4: Paquete a CUOTAS con DESCUENTO ----
  const baby4 = babies[3];
  const pkg4 = paquetes[1]; // Paquete Básico Bs. 500, 2 cuotas
  const discount4 = 100; // Bs. 100 de descuento por promoción
  const precioFinal4 = Number(pkg4.basePrice) - discount4; // 400
  const cuota4 = precioFinal4 / 2; // 200

  const purchase4 = await prisma.packagePurchase.create({
    data: {
      babyId: baby4.id,
      packageId: pkg4.id,
      basePrice: pkg4.basePrice,
      discountAmount: discount4,
      discountReason: 'Promoción de temporada',
      finalPrice: precioFinal4,
      totalSessions: pkg4.sessionCount,
      remainingSessions: pkg4.sessionCount,
      usedSessions: 0,
      isActive: true,
      paymentPlan: 'INSTALLMENTS',
      installments: 2,
      installmentAmount: cuota4,
      paidAmount: cuota4, // Solo pagó primera cuota
    },
  });
  packagesCreated++;

  // Transaction: PACKAGE_SALE (primera cuota con descuento aplicado)
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'PACKAGE_SALE',
      referenceType: 'PackagePurchase',
      referenceId: purchase4.id,
      subtotal: Number(pkg4.basePrice) / 2, // Mitad del precio base
      discountTotal: discount4 / 2, // Mitad del descuento
      total: cuota4,
      paymentMethods: [{ method: 'CARD', amount: cuota4 }],
      notes: `Venta de ${pkg4.name} - Cuota 1 de 2 (con descuento promoción)`,
      createdById: reception.id,
      createdAt: createUTCNoon(2026, 2, 2),
      items: {
        create: {
          itemType: 'PACKAGE',
          referenceId: pkg4.id,
          description: `${pkg4.name} - Cuota 1 de 2`,
          quantity: 1,
          unitPrice: Number(pkg4.basePrice) / 2,
          discountAmount: discount4 / 2,
          discountReason: 'Promoción de temporada',
          finalPrice: cuota4,
        },
      },
    },
  });
  packageSaleTotal += cuota4;

  // Transaction: PACKAGE_INSTALLMENT (segunda cuota del paquete con descuento)
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'PACKAGE_INSTALLMENT',
      referenceType: 'PackagePurchase',
      referenceId: purchase4.id,
      subtotal: Number(pkg4.basePrice) / 2,
      discountTotal: discount4 / 2,
      total: cuota4,
      paymentMethods: [{ method: 'QR', amount: cuota4 }],
      notes: `Cuota 2 de 2 - ${pkg4.name}`,
      createdById: reception.id,
      createdAt: createUTCNoon(2026, 2, 5),
      items: {
        create: {
          itemType: 'INSTALLMENT',
          referenceId: purchase4.id,
          description: `Cuota 2 de 2 - ${pkg4.name}`,
          quantity: 1,
          unitPrice: Number(pkg4.basePrice) / 2,
          discountAmount: discount4 / 2,
          discountReason: 'Promoción de temporada',
          finalPrice: cuota4,
        },
      },
    },
  });
  packageInstallmentTotal += cuota4;

  // Actualizar paidAmount del purchase4 (ahora está pagado completo)
  await prisma.packagePurchase.update({
    where: { id: purchase4.id },
    data: { paidAmount: precioFinal4 }, // 400 (pagó las 2 cuotas)
  });

  console.log(`   ✅ ${packagesCreated} compras de paquetes creadas`);
  console.log(`      - PACKAGE_SALE: Bs. ${packageSaleTotal.toFixed(2)}`);
  console.log(`      - PACKAGE_INSTALLMENT: Bs. ${packageInstallmentTotal.toFixed(2)}\n`);

  // ============================================================
  // 9. SESIONES CON PRODUCTOS (algunos con descuento)
  // ============================================================
  console.log('🧖 Creando sesiones con productos...');

  const purchasesForSessions = [purchase1, purchase2, purchase3];
  const babiesForSessions = [baby1, baby2, baby3];

  for (let i = 0; i < 3; i++) {
    const purchase = purchasesForSessions[i];
    const baby = babiesForSessions[i];
    const therapist = therapists[i % 2];
    const sessionDate = randomDate(startOfMonth, today);

    const appointment = await prisma.appointment.create({
      data: {
        babyId: baby.id,
        therapistId: therapist.id,
        packagePurchaseId: purchase.id,
        date: sessionDate,
        startTime: '09:00',
        endTime: '10:00',
        status: 'COMPLETED',
      },
    });

    const session = await prisma.session.create({
      data: {
        appointmentId: appointment.id,
        babyId: baby.id,
        therapistId: therapist.id,
        packagePurchaseId: purchase.id,
        sessionNumber: 1,
        status: 'COMPLETED',
        startedAt: sessionDate,
        completedAt: sessionDate,
      },
    });
    sessionsCreated++;

    // Agregar producto con descuento en algunas sesiones
    const producto = productos[i];
    const productDiscount = i === 1 ? 10 : 0; // Descuento solo en la segunda sesión

    await prisma.sessionProduct.create({
      data: {
        sessionId: session.id,
        productId: producto.id,
        quantity: 1,
        unitPrice: producto.salePrice,
        isChargeable: true,
        discountAmount: productDiscount,
        discountReason: productDiscount > 0 ? 'Descuento por combo con paquete' : null,
      },
    });

    // Transaction para productos en sesión
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        category: 'SESSION_PRODUCTS',
        referenceType: 'Session',
        referenceId: session.id,
        subtotal: producto.salePrice,
        discountTotal: productDiscount,
        total: Number(producto.salePrice) - productDiscount,
        paymentMethods: [{ method: randomItem(['CASH', 'QR']), amount: Number(producto.salePrice) - productDiscount }],
        createdById: therapist.id,
        createdAt: sessionDate,
        items: {
          create: {
            itemType: 'PRODUCT',
            referenceId: producto.id,
            description: producto.name,
            quantity: 1,
            unitPrice: producto.salePrice,
            discountAmount: productDiscount,
            discountReason: productDiscount > 0 ? 'Descuento por combo con paquete' : null,
            finalPrice: Number(producto.salePrice) - productDiscount,
          },
        },
      },
    });
  }
  console.log(`   ✅ ${sessionsCreated} sesiones con productos creadas\n`);

  // ============================================================
  // 10. BABY CARD PURCHASE (con descuento primera sesión usado)
  // ============================================================
  console.log('💳 Creando compra de Baby Card...');

  const babyForCard = babies[4];
  const cardPurchase = await prisma.babyCardPurchase.create({
    data: {
      babyId: babyForCard.id,
      babyCardId: babyCard.id,
      pricePaid: babyCard.price,
      paymentMethod: 'QR',
      status: 'ACTIVE',
      purchaseDate: randomDate(startOfMonth, today),
      completedSessions: 3,
      // Descuento de primera sesión usado
      firstSessionDiscountUsed: true,
      firstSessionDiscountAmount: 50,
      firstSessionDiscountDate: randomDate(startOfMonth, today),
      createdById: reception.id,
    },
  });

  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'BABY_CARD',
      referenceType: 'BabyCardPurchase',
      referenceId: cardPurchase.id,
      subtotal: babyCard.price,
      discountTotal: 0,
      total: babyCard.price,
      paymentMethods: [{ method: 'QR', amount: Number(babyCard.price) }],
      notes: 'Compra de Baby Card Gold',
      createdById: reception.id,
      createdAt: randomDate(startOfMonth, today),
      items: {
        create: {
          itemType: 'BABY_CARD',
          referenceId: babyCard.id,
          description: babyCard.name,
          quantity: 1,
          unitPrice: babyCard.price,
          discountAmount: 0,
          finalPrice: babyCard.price,
        },
      },
    },
  });
  console.log(`   ✅ Baby Card vendida (descuento 1ra sesión: Bs. 50)\n`);

  // ============================================================
  // 11. EVENTO - INSCRIPCIONES CON DESCUENTOS + PRODUCTOS
  // ============================================================
  console.log('🎫 Creando inscripciones a evento...');

  const eventParticipants = [];
  const eventDiscounts = [
    { type: null, amount: 0, reason: null }, // Sin descuento
    { type: 'FIXED', amount: 20, reason: 'Descuento por referido' }, // Descuento fijo
    { type: 'COURTESY', amount: 80, reason: 'Cortesía colaborador' }, // Cortesía (gratis)
  ];

  for (let i = 0; i < 3; i++) {
    const parent = parents[i];
    const discount = eventDiscounts[i];
    const amountDue = Number(evento.basePrice) - discount.amount;

    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: evento.id,
        parentId: parent.id,
        status: 'CONFIRMED',
        attended: true,
        // Descuento
        discountType: discount.type,
        discountAmount: discount.amount > 0 ? discount.amount : null,
        discountReason: discount.reason,
        // Pago
        amountDue: amountDue,
        amountPaid: amountDue,
        paymentMethod: amountDue > 0 ? randomItem(['CASH', 'QR']) : null,
        registeredById: reception.id,
      },
    });
    eventParticipants.push(participant);

    // Transaction para inscripción (solo si pagó algo)
    if (amountDue > 0) {
      await prisma.transaction.create({
        data: {
          type: 'INCOME',
          category: 'EVENT_REGISTRATION',
          referenceType: 'EventParticipant',
          referenceId: participant.id,
          subtotal: evento.basePrice,
          discountTotal: discount.amount,
          total: amountDue,
          paymentMethods: [{ method: randomItem(['CASH', 'QR']), amount: amountDue }],
          notes: `Inscripción: ${evento.name}${discount.reason ? ` (${discount.reason})` : ''}`,
          createdById: reception.id,
          createdAt: randomDate(startOfMonth, today),
          items: {
            create: {
              itemType: 'EVENT_TICKET',
              referenceId: evento.id,
              description: `Inscripción - ${evento.name}`,
              quantity: 1,
              unitPrice: evento.basePrice,
              discountAmount: discount.amount,
              discountReason: discount.reason,
              finalPrice: amountDue,
            },
          },
        },
      });
    }
  }

  // ---- PRODUCTOS VENDIDOS EN EVENTO (GARANTIZADO) ----
  console.log('🛍️  Agregando ventas de productos en evento...');

  // Venta 1: Crema a participante 1
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'EVENT_PRODUCTS',
      referenceType: 'EventParticipant',
      referenceId: eventParticipants[0].id,
      subtotal: productos[0].salePrice,
      discountTotal: 0,
      total: productos[0].salePrice,
      paymentMethods: [{ method: 'CASH', amount: Number(productos[0].salePrice) }],
      notes: `Venta en evento: ${evento.name} - ${parents[0].name}`,
      createdById: reception.id,
      createdAt: randomDate(startOfMonth, today),
      items: {
        create: {
          itemType: 'PRODUCT',
          referenceId: productos[0].id,
          description: productos[0].name,
          quantity: 1,
          unitPrice: productos[0].salePrice,
          discountAmount: 0,
          finalPrice: productos[0].salePrice,
        },
      },
    },
  });

  // Venta 2: Aceite + Toallitas a participante 2 (con descuento)
  const productoDescuento = 5;
  const totalVenta2 = Number(productos[1].salePrice) + Number(productos[2].salePrice) - productoDescuento;
  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'EVENT_PRODUCTS',
      referenceType: 'EventParticipant',
      referenceId: eventParticipants[1].id,
      subtotal: Number(productos[1].salePrice) + Number(productos[2].salePrice),
      discountTotal: productoDescuento,
      total: totalVenta2,
      paymentMethods: [{ method: 'QR', amount: totalVenta2 }],
      notes: `Venta en evento: ${evento.name} - ${parents[1].name}`,
      createdById: reception.id,
      createdAt: randomDate(startOfMonth, today),
      items: {
        create: [
          {
            itemType: 'PRODUCT',
            referenceId: productos[1].id,
            description: productos[1].name,
            quantity: 1,
            unitPrice: productos[1].salePrice,
            discountAmount: 0,
            finalPrice: productos[1].salePrice,
          },
          {
            itemType: 'PRODUCT',
            referenceId: productos[2].id,
            description: productos[2].name,
            quantity: 1,
            unitPrice: productos[2].salePrice,
            discountAmount: productoDescuento,
            discountReason: 'Descuento por compra múltiple',
            finalPrice: Number(productos[2].salePrice) - productoDescuento,
          },
        ],
      },
    },
  });

  console.log(`   ✅ 3 inscripciones + 2 ventas de productos en evento\n`);

  // ============================================================
  // 12. ANTICIPOS DE CITAS (APPOINTMENT_ADVANCE)
  // ============================================================
  console.log('📅 Creando anticipos de citas...');

  const futureAppointment = await prisma.appointment.create({
    data: {
      babyId: babies[babies.length - 1].id,
      therapistId: therapist1.id,
      selectedPackageId: paquetes[0].id,
      date: createUTCNoon(2026, 2, 15),
      startTime: '11:00',
      endTime: '12:00',
      status: 'SCHEDULED',
      isPendingPayment: true,
    },
  });

  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      category: 'APPOINTMENT_ADVANCE',
      referenceType: 'Appointment',
      referenceId: futureAppointment.id,
      subtotal: 50,
      discountTotal: 0,
      total: 50,
      paymentMethods: [{ method: 'CASH', amount: 50 }],
      notes: 'Anticipo para reservar cita',
      createdById: reception.id,
      createdAt: today,
      items: {
        create: {
          itemType: 'ADVANCE',
          referenceId: futureAppointment.id,
          description: 'Anticipo de cita',
          quantity: 1,
          unitPrice: 50,
          discountAmount: 0,
          finalPrice: 50,
        },
      },
    },
  });
  console.log(`   ✅ Anticipo de cita creado\n`);

  // ============================================================
  // 13. GASTOS (ADMIN_EXPENSE)
  // ============================================================
  console.log('💸 Creando gastos...');

  const gastos = [
    { category: 'SUPPLIES', description: 'Compra de toallas', amount: 300 },
    { category: 'UTILITIES', description: 'Factura de luz', amount: 450 },
    { category: 'MAINTENANCE', description: 'Reparación AC', amount: 200 },
  ];

  for (const gasto of gastos) {
    const expenseDate = randomDate(startOfMonth, today);
    const expense = await prisma.expense.create({
      data: {
        category: gasto.category,
        description: gasto.description,
        amount: gasto.amount,
        expenseDate: expenseDate,
        createdById: admin.id,
      },
    });

    await prisma.transaction.create({
      data: {
        type: 'EXPENSE',
        category: 'ADMIN_EXPENSE',
        referenceType: 'Expense',
        referenceId: expense.id,
        subtotal: gasto.amount,
        discountTotal: 0,
        total: gasto.amount,
        paymentMethods: [{ method: 'CASH', amount: gasto.amount }],
        notes: gasto.description,
        createdById: admin.id,
        createdAt: expenseDate,
        items: {
          create: {
            itemType: 'OTHER',
            description: gasto.description,
            quantity: 1,
            unitPrice: gasto.amount,
            discountAmount: 0,
            finalPrice: gasto.amount,
          },
        },
      },
    });
  }
  console.log(`   ✅ ${gastos.length} gastos creados\n`);

  // ============================================================
  // 14. PAGOS A STAFF (STAFF_PAYMENT)
  // ============================================================
  console.log('👩‍⚕️ Creando pagos a staff...');

  const staffPayment = await prisma.staffPayment.create({
    data: {
      staffId: therapist1.id,
      type: 'SALARY',
      status: 'PAID',
      grossAmount: 3000,
      netAmount: 3000,
      description: 'Salario Febrero 2026',
      periodMonth: 2,
      periodYear: 2026,
      periodStart: createUTCNoon(2026, 2, 1),
      periodEnd: createUTCNoon(2026, 2, 28),
      paidAt: today,
      createdById: admin.id,
    },
  });

  await prisma.transaction.create({
    data: {
      type: 'EXPENSE',
      category: 'STAFF_PAYMENT',
      referenceType: 'StaffPayment',
      referenceId: staffPayment.id,
      subtotal: 3000,
      discountTotal: 0,
      total: 3000,
      paymentMethods: [{ method: 'TRANSFER', amount: 3000 }],
      notes: 'Salario María García - Febrero 2026',
      createdById: admin.id,
      createdAt: today,
      items: {
        create: {
          itemType: 'OTHER',
          referenceId: therapist1.id,
          description: 'Salario Febrero 2026',
          quantity: 1,
          unitPrice: 3000,
          discountAmount: 0,
          finalPrice: 3000,
        },
      },
    },
  });
  console.log(`   ✅ Pago a staff creado\n`);

  // ============================================================
  // RESUMEN FINAL
  // ============================================================
  const totalTransactions = await prisma.transaction.count();
  const totalItems = await prisma.transactionItem.count();

  const incomeByCategory = await prisma.transaction.groupBy({
    by: ['category'],
    where: { type: 'INCOME' },
    _sum: { total: true },
    _count: true,
  });

  const expenseByCategory = await prisma.transaction.groupBy({
    by: ['category'],
    where: { type: 'EXPENSE' },
    _sum: { total: true },
    _count: true,
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    📊 RESUMEN DE DATOS CREADOS');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`📝 Total Transactions: ${totalTransactions}`);
  console.log(`📝 Total TransactionItems: ${totalItems}\n`);

  console.log('💰 INGRESOS por categoría:');
  console.log('───────────────────────────────────────────────────────────');
  let totalIncome = 0;
  for (const cat of incomeByCategory) {
    const amount = Number(cat._sum.total);
    totalIncome += amount;
    console.log(`   ${cat.category.padEnd(25)} ${cat._count} txns  →  Bs. ${amount.toFixed(2)}`);
  }
  console.log('───────────────────────────────────────────────────────────');
  console.log(`   ${'TOTAL INGRESOS'.padEnd(25)}          →  Bs. ${totalIncome.toFixed(2)}\n`);

  console.log('💸 EGRESOS por categoría:');
  console.log('───────────────────────────────────────────────────────────');
  let totalExpense = 0;
  for (const cat of expenseByCategory) {
    const amount = Number(cat._sum.total);
    totalExpense += amount;
    console.log(`   ${cat.category.padEnd(25)} ${cat._count} txns  →  Bs. ${amount.toFixed(2)}`);
  }
  console.log('───────────────────────────────────────────────────────────');
  console.log(`   ${'TOTAL EGRESOS'.padEnd(25)}          →  Bs. ${totalExpense.toFixed(2)}\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log(`   RESULTADO NETO: Bs. ${(totalIncome - totalExpense).toFixed(2)}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('📋 TIPOS DE DESCUENTO INCLUIDOS:');
  console.log('   ✓ Descuento en paquete (cliente frecuente)');
  console.log('   ✓ Descuento en paquete a cuotas (promoción)');
  console.log('   ✓ Descuento en producto de sesión (combo)');
  console.log('   ✓ Descuento fijo en evento (referido)');
  console.log('   ✓ Cortesía completa en evento (gratis)');
  console.log('   ✓ Descuento Baby Card primera sesión\n');

  console.log('✅ Seed completado exitosamente!\n');
  console.log('🔐 Credenciales de prueba:');
  console.log('   Usuario: admin');
  console.log('   Password: 123456\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
