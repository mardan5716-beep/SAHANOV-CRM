# Дизайн: CRM «Glint & Steel» — этап 1 (ядро продаж и склад)

Дата: 2026-07-18
Статус: одобрено пользователем

## Контекст

Переход от CRM мастера-единичника (замеры/монтаж) к CRM серийного производства и
продажи аксессуаров из нержавеющей стали. Стек и авторизация (один пароль) —
сохраняются. Старая доменная модель (Order с замером/монтажом) заменяется полностью.
Старые тестовые данные очищаются, засеваются новые.

Этап 2 (отдельно, позже): многопользовательский вход по email с автоподстановкой
менеджера. Модель менеджера закладывается так, чтобы этап 2 её только расширил.

Главный UX-принцип: оформление сделки менее чем за минуту. Не перегружать.

## Решения (зафиксировано)

- Заменить модель на Glint & Steel (не сохранять старую воронку мастера).
- Позиции сделки — из каталога склада (артикул подтягивает наименование/цену/себестоимость).
- Автосписание остатков со склада при статусе «Отправлено».
- Менеджер — справочник (этап 1). Вход по email — этап 2.
- Мягкое удаление (soft-delete, `deletedAt`) — для всех сущностей.
- Валюта — тенге (₸). Даты — «15 июля 2026».

## Модель данных (Prisma)

```prisma
enum OrderStatus {
  NEW         // Новая заявка
  INVOICED    // Счёт выставлен
  PAID        // Оплачено
  PICKING     // Комплектуется
  PACKED      // Упаковано
  SHIPPED     // Отправлено
  DELIVERED   // Получено
  COMPLETED   // Завершено
  RETURN      // Возврат
  CANCELLED   // Отменено
}

enum PaymentStatus { UNPAID PARTIAL PAID REFUNDED }         // Не оплачено/Частично/Оплачено/Возврат
enum PaymentMethod { KASPI CASH CARD TRANSFER OTHER }        // Kaspi/Наличные/Карта/Перевод/Другое
enum DeliveryMethod { PICKUP DELIVERY }                      // Самовывоз/Доставка
enum DiscountType { PERCENT AMOUNT }                         // % или ₸
enum Category {
  SHELVES CONSOLES SIDE_TABLES PLANT_STANDS ETAGERES
  ORGANIZERS MIRRORS BATHROOM KITCHEN OTHER
}

model Manager {
  id        String   @id @default(cuid())
  name      String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  deletedAt DateTime?
  orders    Order[]
  // этап 2: email String @unique, passwordHash String, role
}

model Client {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  company   String?
  source    String?   // Instagram / Kaspi / сарафан / сайт …
  createdAt DateTime @default(now())
  deletedAt DateTime?
  orders    Order[]
  @@index([deletedAt])
}

model Product {
  id        String   @id @default(cuid())
  sku       String   @unique
  name      String
  category  Category @default(OTHER)
  price     Decimal  @default(0) @db.Decimal(12, 2)  // продажная цена
  cost      Decimal  @default(0) @db.Decimal(12, 2)  // себестоимость
  stock     Int      @default(0)
  minStock  Int      @default(0)
  location  String?
  createdAt DateTime @default(now())
  deletedAt DateTime?
  items     OrderItem[]
  @@index([category])
  @@index([deletedAt])
}

model Order {
  id             String        @id @default(cuid())
  number         String        @unique          // GS-00001
  clientId       String
  client         Client        @relation(fields: [clientId], references: [id])
  managerId      String?
  manager        Manager?      @relation(fields: [managerId], references: [id])
  status         OrderStatus   @default(NEW)
  // оплата
  paymentStatus  PaymentStatus @default(UNPAID)
  paymentMethod  PaymentMethod?
  paid           Decimal       @default(0) @db.Decimal(12, 2)
  // доставка
  deliveryMethod DeliveryMethod @default(PICKUP)
  deliveryAddress String?
  trackNumber    String?
  notes          String?
  stockDeductedAt DateTime?     // служебное: остатки уже списаны
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?
  items          OrderItem[]
  @@index([status])
  @@index([clientId])
  @@index([deletedAt])
}

model OrderItem {
  id            String       @id @default(cuid())
  orderId       String
  order         Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId     String?
  product       Product?     @relation(fields: [productId], references: [id])
  // снимки на момент заказа
  sku           String
  name          String
  unitPrice     Decimal      @db.Decimal(12, 2)
  unitCost      Decimal      @default(0) @db.Decimal(12, 2)
  qty           Int          @default(1)
  discountType  DiscountType @default(PERCENT)
  discountValue Decimal      @default(0) @db.Decimal(12, 2)
}
```

## Вычисляемые значения (в базе не хранятся)

- **Сумма позиции**: `qty × unitPrice` минус скидка (PERCENT → `× value/100`, AMOUNT → `value`).
  Не меньше 0.
- **Сумма заказа (total)**: Σ сумм позиций.
- **Остаток к оплате**: `total − paid`.
- **Себестоимость заказа**: Σ(`unitCost × qty`).
- **Маржа**: `total − себестоимость`. **Маржинальность %**: `маржа / total × 100` (0 при total=0).

Вся эта логика — в `src/lib/order-calc.ts`, покрыта unit-тестами.

## Автосписание склада

- Переход в статус **SHIPPED** и `stockDeductedAt == null` → для каждой позиции с
  `productId` уменьшить `Product.stock` на `qty`, проставить `stockDeductedAt = now`.
- Переход в **RETURN** или **CANCELLED** при `stockDeductedAt != null` → вернуть остатки,
  очистить `stockDeductedAt`.
- Операции в транзакции.
- Предупреждение о низком остатке (`stock ≤ minStock`) — на складе и в дашборде.
  При добавлении позиции сверх текущего остатка — предупреждение (не блокирует).

## Нумерация заказов

`GS-00001` — при создании: найти максимальный существующий номер, +1, форматировать
с ведущими нулями (5 знаков). В транзакции с созданием заказа.

## Страницы

1. **/login** — прежний вход по паролю (email-вход — этап 2).
2. **/ (Дашборд)**:
   - KPI-плитки: активных сделок (не завершено/отменено), сумма к оплате (Σ остатков),
     выручка и маржа за текущий месяц.
   - «Мало на складе»: товары с `stock ≤ minStock` (красным).
   - «Последние сделки»: 5–10 последних.
3. **/orders** — список сделок: карточки (номер, клиент, статус, сумма/остаток, дата).
   Поиск по номеру и клиенту, фильтр по статусу. «+ Новая сделка».
4. **/orders/new** — быстрая форма: клиент (выбор существующего или инлайн-создание
   имя+телефон), менеджер (выбор), позиции (добавление строк из каталога: поиск по
   артикулу/названию → подставляет цену/себестоимость, ввод кол-ва и скидки), оплата
   (способ + внесённая сумма), доставка (самовывоз по умолчанию; при доставке — адрес,
   трек). Итоги пересчитываются на лету.
5. **/orders/[id]** — карточка: позиции с суммами, итог/оплачено/остаток, маржа,
   воронка статусов (кнопки), оплата и доставка, правка, удаление (мягкое).
6. **/orders/[id]/edit** — та же форма с предзаполнением.
7. **/products** — склад: список (поиск, фильтр по категории, низкие остатки красным).
   «+ Товар».
8. **/products/new**, **/products/[id]**, **/products/[id]/edit** — карточка/правка товара.
9. **/clients**, **/clients/[id]**, new/edit — как есть, поля `company`, `source`
   (адрес/заметки убраны из клиента).
10. **/managers** — справочник менеджеров (список, добавить, деактивировать/удалить).

Навигация: Дашборд · Сделки · Склад · Клиенты (+ Менеджеры в меню/настройках).
Mobile-first, нижняя навигация, авто light/dark, тенге, русские даты.

## Качество

- zod-валидация во всех Server Actions (клиент, товар, сделка с позициями, менеджер).
- Unit-тесты: `order-calc` (сумма позиции со скидками %/₸, total, остаток, себестоимость,
  маржа, маржинальность), нумерация заказов, форматирование (есть).
- Seed: 3–4 менеджера/клиента, ~10–12 товаров по категориям (с себестоимостью и
  остатками, часть ниже минимума), 5–6 сделок в разных статусах (включая отгруженную
  со списанным складом, частично оплаченную, возврат).
- README обновить под новую модель.

## Отступления/заметки

- `source` клиента — свободный текст (не enum), чтобы не выдумывать список; при желании
  легко заменить на выпадающий.
- Себестоимость и маржа видны в карточке сделки и дашборде (внутренние KPI).
```
