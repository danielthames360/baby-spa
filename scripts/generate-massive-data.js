/**
 * SCRIPT DE GENERACIÓN DE DATOS MASIVOS PARA TESTING
 *
 * Genera datos realistas para probar rendimiento de reportes.
 *
 * Ejecutar: node scripts/generate-massive-data.js
 * Revertir: node scripts/generate-massive-data.js --cleanup
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// IDs de paquetes existentes
const PACKAGES = [
  { id: 'cml9fphud000e04ify9w542aj', name: 'Sesión Individual', sessions: 1, price: 150 },
  { id: 'cml9fphud000f04if6afj7bp3', name: 'Mini (4 sesiones)', sessions: 4, price: 550 },
  { id: 'cml9fphud000g04if0y3xyd07', name: 'Estándar (8 sesiones)', sessions: 8, price: 1000 },
  { id: 'cml9fphud000h04if25fevirn', name: 'Plus (10 sesiones)', sessions: 10, price: 1200 },
  { id: 'cml9fphud000i04ifbe4cigfd', name: 'Premium (20 sesiones)', sessions: 20, price: 2200 },
];

const THERAPIST_IDS = [
  'cml9fphsv000304ifeojr6nhs',
  'cml9fphsv000404ife1p03pmx',
];

const BABY_CARD_ID = 'cml9fpi73002i04ifr79i2ual';
const ADMIN_USER_ID = 'cml9fphsv000104ifjz2br2fh';
const PAYMENT_METHODS = ['CASH', 'QR', 'CARD', 'TRANSFER'];
const EXPENSE_CATEGORIES = ['RENT', 'UTILITIES', 'SUPPLIES', 'MAINTENANCE', 'MARKETING', 'TAXES', 'OTHER'];
const GENDERS = ['MALE', 'FEMALE'];
const MARKER = 'MASSTEST_';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'BSB-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generatePhone() {
  return `+591${randomInt(60000000, 79999999)}`;
}

function toUTCNoon(date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0));
}

const FIRST_NAMES = ['María', 'Juan', 'Ana', 'Carlos', 'Laura', 'Diego', 'Sofía', 'Miguel', 'Valentina', 'Andrés',
  'Camila', 'Lucas', 'Isabella', 'Mateo', 'Emma', 'Sebastián', 'Paula', 'Daniel', 'Lucía', 'Nicolás'];

const LAST_NAMES = ['García', 'Rodríguez', 'López', 'Martínez', 'González', 'Hernández', 'Pérez', 'Sánchez',
  'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales'];

const BABY_NAMES = ['Luciana', 'Emiliano', 'Valentina', 'Matías', 'Isabella', 'Santiago', 'Camila', 'Benjamín',
  'Sofía', 'Sebastián', 'Emma', 'Tomás', 'Martina', 'Lucas', 'Renata', 'Joaquín'];

// ============================================================
// GENERACIÓN DE DATOS
// ============================================================

async function generateParents(count) {
  console.log(`\n📝 Generando ${count} padres...`);
  const parents = [];
  const usedPhones = new Set();
  const usedCodes = new Set();

  for (let i = 0; i < count; i++) {
    let phone, code;
    do { phone = generatePhone(); } while (usedPhones.has(phone));
    do { code = generateAccessCode(); } while (usedCodes.has(code));
    usedPhones.add(phone);
    usedCodes.add(code);

    parents.push({
      name: `${MARKER}${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
      phone,
      email: `${MARKER.toLowerCase()}test${i}@example.com`,
      accessCode: code,
      status: 'ACTIVE',
      createdAt: randomDate(new Date('2024-01-01'), new Date('2025-06-01')),
    });
  }

  const result = await prisma.parent.createMany({ data: parents, skipDuplicates: true });
  console.log(`   ✅ Creados ${result.count} padres`);
  return result.count;
}

async function generateBabies(count) {
  console.log(`\n👶 Generando ${count} bebés...`);

  const parents = await prisma.parent.findMany({
    where: { name: { startsWith: MARKER } },
    select: { id: true },
  });

  if (parents.length === 0) {
    console.log('   ❌ No hay padres');
    return 0;
  }

  const now = new Date();
  let created = 0;

  // Crear en lotes de 100
  for (let batch = 0; batch < count; batch += 100) {
    const batchSize = Math.min(100, count - batch);
    const babies = [];
    const babyParents = [];

    for (let i = 0; i < batchSize; i++) {
      const birthDate = toUTCNoon(randomDate(
        new Date(now.getFullYear() - 2, now.getMonth() - 6, 1),
        new Date(now.getFullYear(), now.getMonth() - 1, 1)
      ));

      const babyId = `baby_mass_${batch + i}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      babies.push({
        id: babyId,
        name: `${MARKER}${randomElement(BABY_NAMES)} ${batch + i}`,
        birthDate,
        gender: randomElement(GENDERS),
        birthWeeks: randomInt(36, 42),
        birthWeight: randomInt(25, 45) / 10,
        socialMediaConsent: Math.random() > 0.5,
        referralSource: randomElement(['Instagram', 'Facebook', 'Recomendación', 'Google', null]),
        createdAt: randomDate(new Date('2024-01-01'), new Date('2025-08-01')),
      });

      babyParents.push({
        babyId,
        parentId: randomElement(parents).id,
        relationship: Math.random() > 0.5 ? 'MOTHER' : 'FATHER',
        isPrimary: true,
      });
    }

    await prisma.baby.createMany({ data: babies, skipDuplicates: true });
    await prisma.babyParent.createMany({ data: babyParents, skipDuplicates: true });
    created += batchSize;
    process.stdout.write(`\r   Progreso: ${created}/${count}`);
  }

  console.log(`\n   ✅ Creados ${created} bebés`);
  return created;
}

async function generatePackagePurchases(count) {
  console.log(`\n📦 Generando ${count} compras de paquetes...`);

  const babies = await prisma.baby.findMany({
    where: { name: { startsWith: MARKER } },
    select: { id: true },
  });

  if (babies.length === 0) {
    console.log('   ❌ No hay bebés');
    return 0;
  }

  let created = 0;

  for (let batch = 0; batch < count; batch += 100) {
    const batchSize = Math.min(100, count - batch);
    const purchases = [];

    for (let i = 0; i < batchSize; i++) {
      const pkg = randomElement(PACKAGES);
      const purchaseDate = toUTCNoon(randomDate(new Date('2024-06-01'), new Date('2025-12-01')));
      const usedSessions = randomInt(0, pkg.sessions);

      purchases.push({
        babyId: randomElement(babies).id,
        packageId: pkg.id,
        basePrice: pkg.price,
        discountAmount: 0,
        finalPrice: pkg.price,
        totalSessions: pkg.sessions,
        usedSessions: usedSessions,
        remainingSessions: pkg.sessions - usedSessions,
        paymentPlan: 'SINGLE',
        installments: 1,
        paidAmount: pkg.price,
        isActive: usedSessions < pkg.sessions,
        createdAt: purchaseDate,
      });
    }

    const result = await prisma.packagePurchase.createMany({ data: purchases, skipDuplicates: true });
    created += result.count;
    process.stdout.write(`\r   Progreso: ${created}/${count}`);
  }

  console.log(`\n   ✅ Creadas ${created} compras`);
  return created;
}

async function generateAppointmentsAndSessions(appointmentCount) {
  console.log(`\n📅 Generando ${appointmentCount} citas...`);

  const purchases = await prisma.packagePurchase.findMany({
    where: { baby: { name: { startsWith: MARKER } } },
    select: { id: true, babyId: true, packageId: true },
  });

  if (purchases.length === 0) {
    console.log('   ❌ No hay compras de paquetes');
    return { appointments: 0, sessions: 0 };
  }

  const HOURS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
  let appointmentsCreated = 0;
  let sessionsCreated = 0;

  for (let batch = 0; batch < appointmentCount; batch += 200) {
    const batchSize = Math.min(200, appointmentCount - batch);
    const appointments = [];
    const sessions = [];

    for (let i = 0; i < batchSize; i++) {
      const purchase = randomElement(purchases);
      const appointmentDate = toUTCNoon(randomDate(new Date('2024-06-01'), new Date('2026-01-31')));
      const startTime = randomElement(HOURS);
      const endHour = parseInt(startTime.split(':')[0]) + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:00`;
      const therapistId = randomElement(THERAPIST_IDS);

      const rand = Math.random();
      let status;
      if (rand < 0.75) status = 'COMPLETED';
      else if (rand < 0.85) status = 'CANCELLED';
      else if (rand < 0.92) status = 'NO_SHOW';
      else status = 'SCHEDULED';

      const appointmentId = `appt_mass_${batch + i}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

      appointments.push({
        id: appointmentId,
        babyId: purchase.babyId,
        packagePurchaseId: purchase.id,
        selectedPackageId: purchase.packageId,
        therapistId,
        date: appointmentDate,
        startTime,
        endTime,
        status,
        createdAt: new Date(appointmentDate.getTime() - randomInt(1, 14) * 24 * 60 * 60 * 1000),
      });

      if (status === 'COMPLETED') {
        sessions.push({
          appointmentId,
          babyId: purchase.babyId,
          therapistId,
          packagePurchaseId: purchase.id,
          sessionNumber: randomInt(1, 10),
          status: 'COMPLETED',
          createdAt: appointmentDate,
          completedAt: appointmentDate, // Importante para el reporte P&L
        });
      }
    }

    await prisma.appointment.createMany({ data: appointments, skipDuplicates: true });
    await prisma.session.createMany({ data: sessions, skipDuplicates: true });

    appointmentsCreated += appointments.length;
    sessionsCreated += sessions.length;
    process.stdout.write(`\r   Citas: ${appointmentsCreated}, Sesiones: ${sessionsCreated}`);
  }

  console.log(`\n   ✅ ${appointmentsCreated} citas, ${sessionsCreated} sesiones`);
  return { appointments: appointmentsCreated, sessions: sessionsCreated };
}

async function generatePayments(count) {
  console.log(`\n💰 Generando ${count} pagos (PaymentDetail)...`);

  // Obtener sesiones con sus appointments para tener fechas
  const sessions = await prisma.session.findMany({
    where: { appointment: { baby: { name: { startsWith: MARKER } } } },
    select: {
      id: true,
      appointment: { select: { date: true } }
    },
    take: count,
  });

  if (sessions.length === 0) {
    console.log('   ❌ No hay sesiones');
    return 0;
  }

  let created = 0;

  for (let batch = 0; batch < sessions.length; batch += 200) {
    const batchSize = Math.min(200, sessions.length - batch);
    const paymentDetails = [];

    for (let i = 0; i < batchSize; i++) {
      const session = sessions[batch + i];
      // Usar la fecha del appointment para el createdAt del pago
      const paymentDate = session.appointment?.date || new Date();

      paymentDetails.push({
        parentType: 'SESSION',
        parentId: session.id,
        amount: randomInt(100, 250),
        paymentMethod: randomElement(PAYMENT_METHODS),
        createdAt: paymentDate,
        createdById: ADMIN_USER_ID,
      });
    }

    const result = await prisma.paymentDetail.createMany({ data: paymentDetails, skipDuplicates: true });
    created += result.count;
    process.stdout.write(`\r   Progreso: ${created}/${sessions.length}`);
  }

  console.log(`\n   ✅ Creados ${created} pagos`);
  return created;
}

async function generateExpenses(count) {
  console.log(`\n📋 Generando ${count} gastos...`);

  const descriptions = [
    'Alquiler mensual', 'Luz eléctrica', 'Agua', 'Internet', 'Insumos de limpieza',
    'Toallas nuevas', 'Reparación AC', 'Publicidad Instagram', 'Contador', 'Seguro',
  ];

  const expenses = [];

  for (let i = 0; i < count; i++) {
    const date = toUTCNoon(randomDate(new Date('2024-06-01'), new Date('2026-01-31')));
    expenses.push({
      description: `${MARKER}${randomElement(descriptions)}`,
      amount: randomInt(50, 3000),
      category: randomElement(EXPENSE_CATEGORIES),
      expenseDate: date,
      createdById: ADMIN_USER_ID,
    });
  }

  const result = await prisma.expense.createMany({ data: expenses, skipDuplicates: true });
  console.log(`   ✅ Creados ${result.count} gastos`);
  return result.count;
}

async function generateEvents(eventCount, participantCount) {
  console.log(`\n🎉 Generando ${eventCount} eventos...`);

  const eventNames = ['Hora de Juego', 'Babython', 'Taller Prenatal', 'Estimulación Grupal', 'Natación Grupal'];

  const events = [];
  for (let i = 0; i < eventCount; i++) {
    const eventDate = toUTCNoon(randomDate(new Date('2024-06-01'), new Date('2026-03-01')));
    const isFuture = eventDate > new Date();

    events.push({
      id: `event_mass_${i}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: `${MARKER}${randomElement(eventNames)} #${i + 1}`,
      description: 'Evento de prueba',
      type: Math.random() > 0.3 ? 'BABIES' : 'PARENTS',
      date: eventDate,
      startTime: '10:00',
      endTime: '12:00',
      maxParticipants: randomInt(10, 30),
      basePrice: randomInt(50, 200),
      status: isFuture ? 'PUBLISHED' : 'COMPLETED',
      createdById: ADMIN_USER_ID,
    });
  }

  await prisma.event.createMany({ data: events, skipDuplicates: true });

  // Participantes
  const babies = await prisma.baby.findMany({
    where: { name: { startsWith: MARKER } },
    select: { id: true },
    take: 200,
  });

  const parents = await prisma.parent.findMany({
    where: { name: { startsWith: MARKER } },
    select: { id: true },
    take: 200,
  });

  // Obtener eventos con sus fechas para saber cuáles son pasados
  const eventsWithDates = await prisma.event.findMany({
    where: { name: { startsWith: MARKER } },
    select: { id: true, type: true, date: true, status: true },
  });

  const participants = [];
  let pCount = 0;

  for (const event of eventsWithDates) {
    const isPastEvent = event.date < new Date();
    const numParticipants = randomInt(5, 15); // Más participantes por evento
    for (let j = 0; j < numParticipants && pCount < participantCount; j++) {
      const price = randomInt(50, 200);
      const isPaid = Math.random() > 0.2; // 80% pagados
      // Para eventos pasados, 85% asistieron
      const didAttend = isPastEvent && Math.random() > 0.15;

      const baseParticipant = {
        eventId: event.id,
        status: isPaid ? 'CONFIRMED' : 'REGISTERED',
        amountDue: price,
        amountPaid: isPaid ? price : 0,
        registeredById: ADMIN_USER_ID,
        attended: isPastEvent ? didAttend : null,
        attendedAt: didAttend ? event.date : null,
      };

      if (event.type === 'BABIES' && babies.length > 0) {
        participants.push({
          ...baseParticipant,
          babyId: randomElement(babies).id,
        });
      } else if (parents.length > 0) {
        participants.push({
          ...baseParticipant,
          parentId: randomElement(parents).id,
        });
      }
      pCount++;
    }
  }

  if (participants.length > 0) {
    await prisma.eventParticipant.createMany({ data: participants, skipDuplicates: true });
  }

  console.log(`   ✅ ${events.length} eventos, ${participants.length} participantes`);
  return { events: events.length, participants: participants.length };
}

async function generateBabyCards(count) {
  console.log(`\n🎴 Generando ${count} baby cards...`);

  const babies = await prisma.baby.findMany({
    where: { name: { startsWith: MARKER } },
    select: { id: true },
    take: count,
  });

  if (babies.length === 0) {
    console.log('   ❌ No hay bebés');
    return 0;
  }

  const cards = [];
  for (let i = 0; i < Math.min(count, babies.length); i++) {
    const purchaseDate = toUTCNoon(randomDate(new Date('2024-06-01'), new Date('2025-12-01')));
    const completedSessions = randomInt(0, 24);

    cards.push({
      babyCardId: BABY_CARD_ID,
      babyId: babies[i].id,
      purchaseDate,
      pricePaid: 3000,
      completedSessions,
      status: completedSessions >= 24 ? 'COMPLETED' : 'ACTIVE',
      createdById: ADMIN_USER_ID,
    });
  }

  const result = await prisma.babyCardPurchase.createMany({ data: cards, skipDuplicates: true });
  console.log(`   ✅ Creadas ${result.count} baby cards`);
  return result.count;
}

async function generateBabyCardPayments() {
  console.log(`\n💳 Generando pagos de Baby Cards...`);

  const purchases = await prisma.babyCardPurchase.findMany({
    where: { baby: { name: { startsWith: MARKER } } },
    select: { id: true, purchaseDate: true, pricePaid: true },
  });

  if (purchases.length === 0) {
    console.log('   ❌ No hay compras de baby cards');
    return 0;
  }

  const payments = purchases.map(p => ({
    parentType: 'BABY_CARD',
    parentId: p.id,
    amount: Number(p.pricePaid),
    paymentMethod: randomElement(PAYMENT_METHODS),
    createdAt: p.purchaseDate || new Date(),
    createdById: ADMIN_USER_ID,
  }));

  const result = await prisma.paymentDetail.createMany({ data: payments, skipDuplicates: true });
  console.log(`   ✅ Creados ${result.count} pagos de baby cards`);
  return result.count;
}

async function generateEventPayments() {
  console.log(`\n🎟️ Generando pagos de eventos...`);

  const participants = await prisma.eventParticipant.findMany({
    where: { event: { name: { startsWith: MARKER } }, amountPaid: { gt: 0 } },
    select: { id: true, amountPaid: true, event: { select: { date: true } } },
  });

  if (participants.length === 0) {
    console.log('   ❌ No hay participantes con pagos');
    return 0;
  }

  const payments = participants.map(p => ({
    parentType: 'EVENT_PARTICIPANT',
    parentId: p.id,
    amount: Number(p.amountPaid),
    paymentMethod: randomElement(PAYMENT_METHODS),
    createdAt: p.event.date || new Date(),
    createdById: ADMIN_USER_ID,
  }));

  const result = await prisma.paymentDetail.createMany({ data: payments, skipDuplicates: true });
  console.log(`   ✅ Creados ${result.count} pagos de eventos`);
  return result.count;
}

async function generatePackageInstallments() {
  console.log(`\n📄 Generando cuotas de paquetes...`);

  // Obtener compras de paquetes con cuotas configuradas (más de 1 sesión)
  const purchases = await prisma.packagePurchase.findMany({
    where: {
      baby: { name: { startsWith: MARKER } },
      package: { is: { sessionCount: { gte: 4 } } }, // Paquetes con 4+ sesiones pueden tener cuotas
    },
    select: {
      id: true,
      finalPrice: true,
      createdAt: true,
      package: { select: { sessionCount: true } },
    },
    take: 300, // Limitar para no generar demasiados
  });

  if (purchases.length === 0) {
    console.log('   ❌ No hay compras de paquetes elegibles');
    return 0;
  }

  let installmentsCreated = 0;
  let paymentsCreated = 0;

  for (const purchase of purchases) {
    // 30% de las compras tienen cuotas
    if (Math.random() > 0.3) continue;

    const numInstallments = randomInt(2, 4);
    const installmentAmount = Number(purchase.finalPrice) / numInstallments;
    const paidInstallments = randomInt(1, numInstallments);

    for (let i = 1; i <= paidInstallments; i++) {
      const paymentDate = new Date(purchase.createdAt);
      paymentDate.setDate(paymentDate.getDate() + (i - 1) * 30); // Una cuota por mes

      // Crear el PackagePayment
      try {
        await prisma.packagePayment.create({
          data: {
            packagePurchaseId: purchase.id,
            installmentNumber: i,
            amount: installmentAmount,
            paymentMethod: randomElement(PAYMENT_METHODS),
            paidAt: paymentDate,
            createdById: ADMIN_USER_ID,
          },
        });
        installmentsCreated++;

        // Crear el PaymentDetail correspondiente
        await prisma.paymentDetail.create({
          data: {
            parentType: 'PACKAGE_INSTALLMENT',
            parentId: purchase.id,
            amount: installmentAmount,
            paymentMethod: randomElement(PAYMENT_METHODS),
            createdAt: paymentDate,
            createdById: ADMIN_USER_ID,
          },
        });
        paymentsCreated++;
      } catch (e) {
        // Ignore duplicates
      }
    }
  }

  console.log(`   ✅ Creadas ${installmentsCreated} cuotas, ${paymentsCreated} pagos`);
  return installmentsCreated;
}

async function generateSessionProducts() {
  console.log(`\n🧴 Generando productos usados en sesiones...`);

  // Obtener productos existentes
  const products = await prisma.product.findMany({
    select: { id: true, salePrice: true, costPrice: true },
    take: 10,
  });

  if (products.length === 0) {
    console.log('   ❌ No hay productos');
    return 0;
  }

  // Obtener sesiones masivas
  const sessions = await prisma.session.findMany({
    where: { appointment: { baby: { name: { startsWith: MARKER } } } },
    select: { id: true },
    take: 500, // Limitar
  });

  if (sessions.length === 0) {
    console.log('   ❌ No hay sesiones');
    return 0;
  }

  const sessionProducts = [];

  for (const session of sessions) {
    // 40% de sesiones usan productos
    if (Math.random() > 0.4) continue;

    const numProducts = randomInt(1, 3);
    for (let i = 0; i < numProducts; i++) {
      const product = randomElement(products);
      sessionProducts.push({
        sessionId: session.id,
        productId: product.id,
        quantity: randomInt(1, 2),
        unitPrice: Number(product.costPrice) || 10,
        isChargeable: Math.random() > 0.7, // 30% son cobrables
      });
    }
  }

  if (sessionProducts.length === 0) {
    console.log('   ❌ No se generaron productos');
    return 0;
  }

  const result = await prisma.sessionProduct.createMany({ data: sessionProducts, skipDuplicates: true });
  console.log(`   ✅ Creados ${result.count} productos en sesiones`);
  return result.count;
}

async function generateEventProducts() {
  console.log(`\n🎈 Generando productos usados en eventos...`);

  const products = await prisma.product.findMany({
    select: { id: true, costPrice: true },
    take: 10,
  });

  if (products.length === 0) {
    console.log('   ❌ No hay productos');
    return 0;
  }

  const events = await prisma.event.findMany({
    where: { name: { startsWith: MARKER } },
    select: { id: true },
  });

  if (events.length === 0) {
    console.log('   ❌ No hay eventos');
    return 0;
  }

  const eventProducts = [];

  for (const event of events) {
    // 60% de eventos usan productos
    if (Math.random() > 0.6) continue;

    const numProducts = randomInt(1, 4);
    for (let i = 0; i < numProducts; i++) {
      const product = randomElement(products);
      eventProducts.push({
        eventId: event.id,
        productId: product.id,
        quantity: randomInt(2, 10), // Más cantidad en eventos
        unitPrice: Number(product.costPrice) || 10,
      });
    }
  }

  if (eventProducts.length === 0) {
    console.log('   ❌ No se generaron productos');
    return 0;
  }

  const result = await prisma.eventProductUsage.createMany({ data: eventProducts, skipDuplicates: true });
  console.log(`   ✅ Creados ${result.count} productos en eventos`);
  return result.count;
}

// ============================================================
// CLEANUP
// ============================================================

async function cleanup() {
  console.log('\n🧹 Limpiando datos de prueba masivos...\n');

  try {
    // Obtener IDs para limpieza
    const massiveSessions = await prisma.session.findMany({
      where: { appointment: { baby: { name: { startsWith: MARKER } } } },
      select: { id: true },
    });
    const sessionIds = massiveSessions.map(s => s.id);

    const massiveBabyCards = await prisma.babyCardPurchase.findMany({
      where: { baby: { name: { startsWith: MARKER } } },
      select: { id: true },
    });
    const babyCardIds = massiveBabyCards.map(b => b.id);

    const massiveParticipants = await prisma.eventParticipant.findMany({
      where: { event: { name: { startsWith: MARKER } } },
      select: { id: true },
    });
    const participantIds = massiveParticipants.map(p => p.id);

    const massivePurchases = await prisma.packagePurchase.findMany({
      where: { baby: { name: { startsWith: MARKER } } },
      select: { id: true },
    });
    const purchaseIds = massivePurchases.map(p => p.id);

    // PaymentDetails de sesiones
    let r;
    if (sessionIds.length > 0) {
      r = await prisma.paymentDetail.deleteMany({
        where: { parentType: 'SESSION', parentId: { in: sessionIds } }
      });
      console.log(`   PaymentDetails (sesiones): ${r.count}`);
    }

    // PaymentDetails de baby cards
    if (babyCardIds.length > 0) {
      r = await prisma.paymentDetail.deleteMany({
        where: { parentType: 'BABY_CARD', parentId: { in: babyCardIds } }
      });
      console.log(`   PaymentDetails (baby cards): ${r.count}`);
    }

    // PaymentDetails de eventos
    if (participantIds.length > 0) {
      r = await prisma.paymentDetail.deleteMany({
        where: { parentType: 'EVENT_PARTICIPANT', parentId: { in: participantIds } }
      });
      console.log(`   PaymentDetails (eventos): ${r.count}`);
    }

    // PaymentDetails de cuotas
    if (purchaseIds.length > 0) {
      r = await prisma.paymentDetail.deleteMany({
        where: { parentType: 'PACKAGE_INSTALLMENT', parentId: { in: purchaseIds } }
      });
      console.log(`   PaymentDetails (cuotas): ${r.count}`);
    }

    // PackagePayments (cuotas)
    if (purchaseIds.length > 0) {
      r = await prisma.packagePayment.deleteMany({
        where: { packagePurchaseId: { in: purchaseIds } }
      });
      console.log(`   Cuotas: ${r.count}`);
    }

    // SessionProducts
    if (sessionIds.length > 0) {
      r = await prisma.sessionProduct.deleteMany({
        where: { sessionId: { in: sessionIds } }
      });
      console.log(`   Productos sesiones: ${r.count}`);
    }

    // EventProductUsage
    r = await prisma.eventProductUsage.deleteMany({
      where: { event: { name: { startsWith: MARKER } } }
    });
    console.log(`   Productos eventos: ${r.count}`);

    // Sesiones
    r = await prisma.session.deleteMany({ where: { appointment: { baby: { name: { startsWith: MARKER } } } } });
    console.log(`   Sesiones: ${r.count}`);

    // Citas
    r = await prisma.appointment.deleteMany({ where: { baby: { name: { startsWith: MARKER } } } });
    console.log(`   Citas: ${r.count}`);

    // Participantes eventos
    r = await prisma.eventParticipant.deleteMany({ where: { event: { name: { startsWith: MARKER } } } });
    console.log(`   Participantes: ${r.count}`);

    // Eventos
    r = await prisma.event.deleteMany({ where: { name: { startsWith: MARKER } } });
    console.log(`   Eventos: ${r.count}`);

    // Baby cards
    r = await prisma.babyCardPurchase.deleteMany({ where: { baby: { name: { startsWith: MARKER } } } });
    console.log(`   Baby cards: ${r.count}`);

    // Compras de paquetes
    r = await prisma.packagePurchase.deleteMany({ where: { baby: { name: { startsWith: MARKER } } } });
    console.log(`   Compras paquetes: ${r.count}`);

    // Relaciones bebé-padre
    r = await prisma.babyParent.deleteMany({ where: { baby: { name: { startsWith: MARKER } } } });
    console.log(`   Relaciones: ${r.count}`);

    // Bebés
    r = await prisma.baby.deleteMany({ where: { name: { startsWith: MARKER } } });
    console.log(`   Bebés: ${r.count}`);

    // Padres
    r = await prisma.parent.deleteMany({ where: { name: { startsWith: MARKER } } });
    console.log(`   Padres: ${r.count}`);

    // Gastos
    r = await prisma.expense.deleteMany({ where: { description: { startsWith: MARKER } } });
    console.log(`   Gastos: ${r.count}`);

    console.log('\n✅ Limpieza completada');
  } catch (error) {
    console.error('Error en limpieza:', error.message);
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const isCleanup = process.argv.includes('--cleanup');

  if (isCleanup) {
    await cleanup();
  } else {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   GENERADOR DE DATOS MASIVOS - BABY SPA                ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\nEsto puede tomar varios minutos...\n');

    const start = Date.now();

    try {
      await generateParents(500);
      await generateBabies(600);
      await generatePackagePurchases(800);
      await generateAppointmentsAndSessions(5000);
      await generatePayments(3000);
      await generateExpenses(200);
      await generateEvents(50, 500);
      await generateBabyCards(100);

      // Pagos adicionales para reportes
      await generateBabyCardPayments();
      await generateEventPayments();
      await generatePackageInstallments();

      // Productos usados
      await generateSessionProducts();
      await generateEventProducts();

      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║   ✅ GENERACIÓN COMPLETADA                             ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log(`\nTiempo total: ${elapsed} segundos`);
      console.log('\nPara limpiar: node scripts/generate-massive-data.js --cleanup');
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      console.log('\nLimpiando datos parciales...');
      await cleanup();
      throw error;
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
