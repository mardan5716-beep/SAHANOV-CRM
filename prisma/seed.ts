import { PrismaClient, Status } from '@prisma/client'

const prisma = new PrismaClient()

/** Дата со смещением на n дней от сегодня (полдень, чтобы избежать пограничных зон). */
function daysFromNow(n: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

async function main() {
  // Очистка (заказы удалятся каскадно вместе с клиентами, но чистим явно для наглядности)
  await prisma.order.deleteMany()
  await prisma.client.deleteMany()

  const ivan = await prisma.client.create({
    data: {
      name: 'Иван Петров',
      phone: '+7 900 123-45-67',
      address: 'г. Москва, ул. Ленина, 10',
      notes: 'Постоянный клиент, заказывает регулярно.',
    },
  })

  const stalDom = await prisma.client.create({
    data: {
      name: 'ООО «СтальДом» (Сергей)',
      phone: '+7 926 555-10-20',
      address: 'г. Химки, Складская, 5, офис 3',
      notes: 'Оптовые заказы для объектов.',
    },
  })

  const anna = await prisma.client.create({
    data: {
      name: 'Анна Кузнецова',
      phone: '+7 903 777-88-99',
      address: 'г. Одинцово, пер. Садовый, 2',
    },
  })

  await prisma.order.create({
    data: {
      clientId: ivan.id,
      title: 'Перила для лестницы',
      description: 'Нержавеющая труба Ø50, 6 стоек, поручень на второй этаж.',
      status: Status.NEW,
      price: 45000,
      prepaid: 0,
      measureDate: daysFromNow(0), // замер сегодня
    },
  })

  await prisma.order.create({
    data: {
      clientId: stalDom.id,
      title: 'Кухонная столешница из нержавейки',
      description: 'Рабочая поверхность 3 м с бортиком, шлифовка.',
      status: Status.MEASURE,
      price: 80000,
      prepaid: 20000,
      measureDate: daysFromNow(-1), // замер просрочен
    },
  })

  await prisma.order.create({
    data: {
      clientId: anna.id,
      title: 'Стеллаж для склада',
      description: '5 ярусов, нагрузка до 200 кг на полку.',
      status: Status.PRODUCTION,
      price: 60000,
      prepaid: 30000,
      dueDate: daysFromNow(2), // срок сдачи через 2 дня
    },
  })

  await prisma.order.create({
    data: {
      clientId: ivan.id,
      title: 'Барная стойка',
      description: 'Стойка с полкой и подставкой для бокалов.',
      status: Status.INSTALL,
      price: 120000,
      prepaid: 60000,
      dueDate: daysFromNow(-1), // срок сдачи просрочен
    },
  })

  await prisma.order.create({
    data: {
      clientId: stalDom.id,
      title: 'Ограждение террасы',
      description: 'Ограждение 12 м со стеклянными вставками.',
      status: Status.DONE,
      price: 55000,
      prepaid: 40000, // остаток 15 000 — ждёт оплаты
      measureDate: daysFromNow(-20),
      dueDate: daysFromNow(-5),
    },
  })

  console.log('Seed завершён: 3 клиента, 5 заказов.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
