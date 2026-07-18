import {
  PrismaClient,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DeliveryMethod,
  DiscountType,
  Category,
} from '@prisma/client'
import { hashPassword } from '../src/lib/password'

const prisma = new PrismaClient()

const DEFAULT_PASSWORD = 'changeme'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d
}

function orderNumber(n: number): string {
  return `GS-${String(n).padStart(5, '0')}`
}

type SeedItem = {
  productId: string
  sku: string
  name: string
  unitPrice: number
  unitCost: number
  qty: number
  discountType: DiscountType
  discountValue: number
}

function lineSum(i: SeedItem): number {
  const sub = i.qty * i.unitPrice
  const disc = i.discountType === 'PERCENT' ? (sub * i.discountValue) / 100 : i.discountValue
  return Math.max(0, sub - disc)
}
function totalSum(items: SeedItem[]): number {
  return items.reduce((s, i) => s + lineSum(i), 0)
}

async function main() {
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.client.deleteMany()
  await prisma.manager.deleteMany()

  // Менеджеры (первый — админ). Пароль по умолчанию у всех — DEFAULT_PASSWORD.
  const passwordHash = await hashPassword(DEFAULT_PASSWORD)
  const [daniyar, asel, timur] = await Promise.all([
    prisma.manager.create({
      data: { name: 'Данияр', email: 'admin@glint.kz', passwordHash, isAdmin: true },
    }),
    prisma.manager.create({
      data: { name: 'Асель', email: 'asel@glint.kz', passwordHash, isAdmin: false },
    }),
    prisma.manager.create({
      data: { name: 'Тимур', email: 'timur@glint.kz', passwordHash, isAdmin: false },
    }),
  ])

  // Клиенты
  const aigul = await prisma.client.create({
    data: { name: 'Айгуль Смагулова', phone: '+7 700 111 22 33', source: 'Instagram' },
  })
  const komfort = await prisma.client.create({
    data: {
      name: 'Ерлан (ТОО «Комфорт»)',
      phone: '+7 701 222 33 44',
      company: 'ТОО «Комфорт»',
      source: 'Kaspi',
    },
  })
  const danara = await prisma.client.create({
    data: { name: 'Данара Ким', phone: '+7 702 333 44 55', source: 'сарафан' },
  })
  const nurlan = await prisma.client.create({
    data: { name: 'Нурлан Абаев', phone: '+7 705 444 55 66', source: 'сайт' },
  })

  // Товары (часть с остатком на минимуме или ниже)
  const P = await Promise.all(
    [
      ['GS-SHELF-01', 'Полка настенная 60 см', Category.SHELVES, 14000, 8000, 12, 4, 'Стеллаж A1'],
      ['GS-SHELF-02', 'Полка угловая', Category.SHELVES, 16000, 9000, 3, 4, 'Стеллаж A1'],
      ['GS-CONS-01', 'Консоль в прихожую', Category.CONSOLES, 42000, 25000, 5, 2, 'Стеллаж B1'],
      ['GS-SIDE-01', 'Приставной столик', Category.SIDE_TABLES, 28000, 16000, 8, 3, 'Стеллаж B2'],
      ['GS-PLANT-01', 'Подставка для цветов', Category.PLANT_STANDS, 9000, 4500, 20, 5, 'Стеллаж C1'],
      ['GS-PLANT-02', 'Подставка тройная', Category.PLANT_STANDS, 15000, 8000, 2, 4, 'Стеллаж C1'],
      ['GS-ETAG-01', 'Этажерка 4 яруса', Category.ETAGERES, 32000, 18000, 6, 2, 'Стеллаж C2'],
      ['GS-ORG-01', 'Органайзер для кухни', Category.ORGANIZERS, 7000, 3500, 30, 8, 'Стеллаж D1'],
      ['GS-MIRR-01', 'Зеркало круглое', Category.MIRRORS, 22000, 12000, 4, 3, 'Стеллаж D2'],
      ['GS-BATH-01', 'Держатель для полотенец', Category.BATHROOM, 6000, 2800, 25, 10, 'Стеллаж E1'],
      ['GS-KITCH-01', 'Рейлинг кухонный', Category.KITCHEN, 8500, 4000, 1, 5, 'Стеллаж E2'],
      ['GS-OTH-01', 'Крючки настенные (комплект)', Category.OTHER, 3000, 1200, 40, 10, 'Стеллаж F1'],
    ].map(([sku, name, category, price, cost, stock, minStock, location]) =>
      prisma.product.create({
        data: {
          sku: sku as string,
          name: name as string,
          category: category as Category,
          price: price as number,
          cost: cost as number,
          stock: stock as number,
          minStock: minStock as number,
          location: location as string,
        },
      }),
    ),
  )
  const bySku = Object.fromEntries(P.map((p) => [p.sku, p]))

  function item(sku: string, qty: number, discountValue = 0, discountType = DiscountType.PERCENT): SeedItem {
    const p = bySku[sku]
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      unitPrice: Number(p.price),
      unitCost: Number(p.cost),
      qty,
      discountType,
      discountValue,
    }
  }

  type OrderSeed = {
    n: number
    clientId: string
    managerId: string
    status: OrderStatus
    paymentStatus: PaymentStatus
    paymentMethod?: PaymentMethod
    paidRatio: number // доля от суммы
    delivery: DeliveryMethod
    deliveryAddress?: string
    deliveryCost?: number
    trackNumber?: string
    shipped?: boolean // остатки списаны
    createdAt: Date
    items: SeedItem[]
  }

  const orders: OrderSeed[] = [
    {
      n: 1,
      clientId: aigul.id,
      managerId: daniyar.id,
      status: OrderStatus.NEW,
      paymentStatus: PaymentStatus.UNPAID,
      paidRatio: 0,
      delivery: DeliveryMethod.PICKUP,
      createdAt: daysAgo(0),
      items: [item('GS-SHELF-01', 2), item('GS-ORG-01', 1)],
    },
    {
      n: 2,
      clientId: komfort.id,
      managerId: asel.id,
      status: OrderStatus.INVOICED,
      paymentStatus: PaymentStatus.PARTIAL,
      paymentMethod: PaymentMethod.KASPI,
      paidRatio: 0.5,
      delivery: DeliveryMethod.DELIVERY,
      deliveryAddress: 'г. Алматы, ул. Абая 15, офис 4',
      deliveryCost: 2500,
      createdAt: daysAgo(1),
      items: [item('GS-CONS-01', 1), item('GS-MIRR-01', 2, 10)],
    },
    {
      n: 3,
      clientId: danara.id,
      managerId: daniyar.id,
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.KASPI,
      paidRatio: 1,
      delivery: DeliveryMethod.PICKUP,
      createdAt: daysAgo(2),
      items: [item('GS-PLANT-01', 3), item('GS-BATH-01', 2)],
    },
    {
      n: 4,
      clientId: aigul.id,
      managerId: timur.id,
      status: OrderStatus.SHIPPED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CARD,
      paidRatio: 1,
      delivery: DeliveryMethod.DELIVERY,
      deliveryAddress: 'г. Астана, пр. Мангилик Ел 20',
      deliveryCost: 0, // бесплатная доставка
      trackNumber: 'KZ123456789',
      shipped: true,
      createdAt: daysAgo(4),
      items: [item('GS-SIDE-01', 1), item('GS-ETAG-01', 1)],
    },
    {
      n: 5,
      clientId: nurlan.id,
      managerId: asel.id,
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      paymentMethod: PaymentMethod.CASH,
      paidRatio: 1,
      delivery: DeliveryMethod.PICKUP,
      shipped: true,
      createdAt: daysAgo(10),
      items: [item('GS-KITCH-01', 1), item('GS-OTH-01', 2)],
    },
    {
      n: 6,
      clientId: komfort.id,
      managerId: daniyar.id,
      status: OrderStatus.RETURN,
      paymentStatus: PaymentStatus.REFUNDED,
      paymentMethod: PaymentMethod.KASPI,
      paidRatio: 0,
      delivery: DeliveryMethod.DELIVERY,
      deliveryAddress: 'г. Алматы, мкр. Самал-2, 33',
      deliveryCost: 1500,
      createdAt: daysAgo(15),
      items: [item('GS-SHELF-02', 1)],
    },
  ]

  for (const o of orders) {
    const total = totalSum(o.items) + (o.deliveryCost ?? 0)
    await prisma.order.create({
      data: {
        number: orderNumber(o.n),
        clientId: o.clientId,
        managerId: o.managerId,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        paid: Math.round(total * o.paidRatio),
        deliveryMethod: o.delivery,
        deliveryAddress: o.deliveryAddress,
        deliveryCost: o.deliveryCost ?? 0,
        trackNumber: o.trackNumber,
        stockDeductedAt: o.shipped ? o.createdAt : null,
        createdAt: o.createdAt,
        items: {
          create: o.items.map((i) => ({
            productId: i.productId,
            sku: i.sku,
            name: i.name,
            unitPrice: i.unitPrice,
            unitCost: i.unitCost,
            qty: i.qty,
            discountType: i.discountType,
            discountValue: i.discountValue,
          })),
        },
      },
    })

    // отгруженные/завершённые заказы списывают склад
    if (o.shipped) {
      for (const i of o.items) {
        await prisma.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.qty } },
        })
      }
    }
  }

  console.log('Seed завершён: 3 менеджера, 4 клиента, 12 товаров, 6 сделок.')
  console.log('Вход админа: admin@glint.kz / changeme (смените пароль!)')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
