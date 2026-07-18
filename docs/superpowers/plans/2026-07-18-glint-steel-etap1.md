# Glint & Steel этап 1 — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Заменить модель мастера на CRM серийных продаж Glint & Steel: склад, сделки с позициями из каталога, оплата, доставка, автосписание, KPI.

**Architecture:** Тот же Next.js 14 проект. Новые Prisma-модели (Manager, Client, Product, Order, OrderItem) + enum. Чистая логика расчётов (суммы/скидки/маржа, нумерация) в `src/lib`, покрыта vitest. Форма сделки — клиентский компонент с динамическими позициями, отправляет позиции JSON-строкой; server action парсит и валидирует zod. Автосписание склада — в транзакции при смене статуса.

**Tech Stack:** Next.js 14, TS, Tailwind, Prisma, Postgres, zod, vitest.

## Global Constraints

- Русский интерфейс, тенге (₸), даты «15 июля 2026», mobile-first, авто light/dark.
- Один вход по паролю (email-вход — этап 2, вне этого плана).
- Мягкое удаление (`deletedAt`) для всех сущностей; все запросы фильтруют `deletedAt: null`.
- Позиции сделки — снимки sku/name/unitPrice/unitCost на момент заказа.
- Автосписание при статусе SHIPPED (однократно), возврат при RETURN/CANCELLED.
- Номер заказа `GS-00001`.
- Категории/статусы/способы оплаты — строго из spec.

---

### Task 1: Новая Prisma-схема и миграция (замена модели)

**Files:** Modify `prisma/schema.prisma`; Create миграция.

- [ ] **Step 1:** Заменить модели `Client`/`Order`/enum `Status` на новую схему из
  дизайн-дока (enum `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `DeliveryMethod`,
  `DiscountType`, `Category`; модели `Manager`, `Client`, `Product`, `Order`, `OrderItem`).
- [ ] **Step 2:** Остановить dev-сервер (освободить Prisma engine). Выполнить
  `npx prisma migrate reset --force` затем `npx prisma migrate dev --name glint_steel`
  (данные очищаются — одобрено). Expected: новые таблицы созданы, Prisma Client сгенерирован.
- [ ] **Step 3: Commit** — `feat(gs): новая модель Glint & Steel (склад, сделки, позиции)`

---

### Task 2: Метки и цвета enum (`src/lib/enums.ts`)

**Files:** Create `src/lib/enums.ts`; удалить неактуальный `src/lib/status.ts`.

**Interfaces:** `ORDER_STATUS_ORDER`, `orderStatusLabel`, `orderStatusBadgeClass`,
`orderStatusStepActiveClass`, `nextOrderStatus`; `paymentStatusLabel/BadgeClass`,
`paymentMethodLabel`, `deliveryMethodLabel`, `categoryLabel`, `CATEGORY_ORDER`,
`discountTypeLabel`.

- [ ] **Step 1:** Реализовать метки (рус) и Tailwind-классы бейджей для всех enum;
  `ORDER_STATUS_ORDER` = порядок воронки; `nextOrderStatus` — следующий в воронке
  (после DELIVERED → COMPLETED; RETURN/CANCELLED — вне линейной воронки, next = null).
  Цвета: NEW серый · INVOICED синий · PAID/COMPLETED зелёный · PICKING/PACKED оранжевый ·
  SHIPPED/DELIVERED фиолетовый · RETURN/CANCELLED красный.
- [ ] **Step 2:** Обновить импортеров `status.ts` (их пока нет — старые страницы будут
  переписаны). Commit — `feat(gs): метки и цвета статусов/категорий`

---

### Task 3: Расчёты заказа (`src/lib/order-calc.ts`) — TDD

**Files:** Create `src/lib/order-calc.ts`, `src/lib/order-calc.test.ts`.

**Interfaces:**
- `type CalcItem = { qty: number; unitPrice: number|string; unitCost?: number|string; discountType: 'PERCENT'|'AMOUNT'; discountValue: number|string }`
- `lineTotal(item): number` — `qty*unitPrice` минус скидка, не меньше 0.
- `orderTotal(items): number`; `orderCost(items): number`;
  `orderBalance(total, paid): number`; `margin(total, cost): number`;
  `marginPercent(total, cost): number` (0 при total=0).

- [ ] **Step 1: тест** (кейсы):
```ts
import { describe, it, expect } from 'vitest'
import { lineTotal, orderTotal, orderCost, orderBalance, margin, marginPercent } from './order-calc'

const item = (o: any) => ({ qty: 1, unitPrice: 0, unitCost: 0, discountType: 'PERCENT', discountValue: 0, ...o })

describe('lineTotal', () => {
  it('без скидки', () => expect(lineTotal(item({ qty: 3, unitPrice: 1000 }))).toBe(3000))
  it('скидка %', () => expect(lineTotal(item({ qty: 2, unitPrice: 1000, discountType: 'PERCENT', discountValue: 10 }))).toBe(1800))
  it('скидка ₸', () => expect(lineTotal(item({ qty: 2, unitPrice: 1000, discountType: 'AMOUNT', discountValue: 500 }))).toBe(1500))
  it('скидка не уводит в минус', () => expect(lineTotal(item({ qty: 1, unitPrice: 1000, discountType: 'AMOUNT', discountValue: 5000 }))).toBe(0))
})
describe('итоги', () => {
  const items = [item({ qty: 2, unitPrice: 1000, unitCost: 600 }), item({ qty: 1, unitPrice: 3000, unitCost: 2000 })]
  it('orderTotal', () => expect(orderTotal(items)).toBe(5000))
  it('orderCost', () => expect(orderCost(items)).toBe(3200))
  it('orderBalance', () => expect(orderBalance(5000, 2000)).toBe(3000))
  it('margin', () => expect(margin(5000, 3200)).toBe(1800))
  it('marginPercent', () => expect(marginPercent(5000, 3200)).toBe(36))
  it('marginPercent при total=0 → 0', () => expect(marginPercent(0, 0)).toBe(0))
})
```
- [ ] **Step 2:** Run `npx vitest run src/lib/order-calc.test.ts` → FAIL.
- [ ] **Step 3:** Реализация (Number() приведение; PERCENT → `sub*value/100`, AMOUNT → `value`;
  `Math.max(0, …)`; marginPercent округлять до 1 знака или целого — тест ждёт 36, делать
  `Math.round`). 
- [ ] **Step 4:** Run → PASS. **Commit** — `feat(gs): расчёты сумм, скидок и маржи + тесты`

---

### Task 4: Нумерация заказов (`src/lib/order-number.ts`) — TDD

**Files:** Create `src/lib/order-number.ts`, `src/lib/order-number.test.ts`.

**Interfaces:** `formatOrderNumber(n: number): string` → `GS-00001`;
`parseOrderNumber(s: string): number` → число или 0; async `nextOrderNumber(): Promise<string>`
(читает max, +1) — не тестируется юнитом.

- [ ] **Step 1: тест** `formatOrderNumber(1)==='GS-00001'`, `formatOrderNumber(123)==='GS-00123'`,
  `parseOrderNumber('GS-00042')===42`, `parseOrderNumber('мусор')===0`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Реализация: `GS-` + `String(n).padStart(5,'0')`; parse через regex.
  `nextOrderNumber`: `prisma.order.findFirst({ orderBy:{createdAt:'desc'} })` неустойчив —
  вместо этого выбрать все number, распарсить, взять max, +1. (Заказов немного.)
- [ ] **Step 4:** Run → PASS. **Commit** — `feat(gs): нумерация заказов GS-00001 + тесты`

---

### Task 5: Валидация zod (`src/lib/validation.ts`) — TDD

**Files:** Rewrite `src/lib/validation.ts`, `src/lib/validation.test.ts`.

**Interfaces:** `clientSchema` (name*, phone?, company?, source?), `productSchema`
(sku*, name*, category enum, price≥0, cost≥0, stock int≥0, minStock int≥0, location?),
`managerSchema` (name*), `orderItemSchema` (productId?, sku*, name*, unitPrice≥0,
unitCost≥0, qty int≥1, discountType enum, discountValue≥0), `orderSchema`
(clientId*, managerId?, status enum, paymentStatus enum, paymentMethod enum?, paid≥0,
deliveryMethod enum, deliveryAddress?, trackNumber?, notes?, items: array(min 1)).
Helpers `parseClient/parseProduct/parseManager` (из FormData) и `parseOrder(formData)` —
позиции читаются из поля `items` (JSON-строка) → `JSON.parse` → массив.

- [ ] **Step 1: тест**: пустой sku товара → ошибка; цена «12 500» → 12500; qty дробное → ошибка/округление;
  заказ без позиций → ошибка; заказ с 1 валидной позицией → success; discountType неверный → ошибка.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Реализация (переиспользовать `requiredString`, `optionalString`,
  `moneyField`; добавить `intField` = preprocess→целое≥0; `orderItemSchema`; `parseOrder`
  парсит `items` JSON). 
- [ ] **Step 4:** Run → PASS. **Commit** — `feat(gs): zod-валидация товаров, сделок с позициями + тесты`

---

### Task 6: Server Actions — менеджеры и товары

**Files:** Create `src/actions/managers.ts`, `src/actions/products.ts`.

**Interfaces:** managers: `createManager/updateManager/deleteManager`;
products: `createProduct/updateProduct/deleteProduct` (мягко), возвращают
`{error?, fieldErrors?}`, revalidate + redirect.

- [ ] **Step 1:** Реализация обоих (валидация, prisma, soft-delete). sku уникален —
  ловить ошибку уникальности → `{ fieldErrors: { sku: ['Артикул уже используется'] } }`.
- [ ] **Step 2: Commit** — `feat(gs): server actions менеджеров и товаров`

---

### Task 7: Server Actions — клиенты и сделки (позиции, нумерация, автосписание)

**Files:** Rewrite `src/actions/clients.ts`; Create/rewrite `src/actions/orders.ts`.

**Interfaces:** clients: `createClient/updateClient/deleteClient` (новые поля);
orders: `createOrder` (транзакция: nextOrderNumber + создать Order + createMany items),
`updateOrder` (обновить поля + пересоздать items), `deleteOrder` (мягко), `setStatus`
(смена статуса + автосписание/возврат склада в транзакции), `quickCreateClient(name, phone)`
(инлайн-создание из формы сделки, возвращает id).

- [ ] **Step 1:** `createOrder`: parseOrder; в `$transaction` — вычислить номер, создать
  заказ, создать позиции (снимки). `paid`/paymentStatus — как переданы. revalidate.
- [ ] **Step 2:** `setStatus`: в транзакции — обновить статус; если новый SHIPPED и
  `stockDeductedAt==null` → для позиций с productId `product.update stock: {decrement: qty}`,
  set `stockDeductedAt`; если RETURN/CANCELLED и `stockDeductedAt!=null` → `increment`,
  clear. 
- [ ] **Step 3:** `updateOrder`: обновить поля заказа; удалить старые items и создать
  новые (`deleteMany` + `createMany`). (Склад не трогаем при правке — только при статусе.)
- [ ] **Step 4:** `deleteClient` мягко (+ мягко его заказы); `deleteOrder` мягко.
- [ ] **Step 5: Commit** — `feat(gs): server actions сделок (позиции, номер, автосписание) и клиентов`

---

### Task 8: Выборки дашборда (`src/lib/dashboard.ts`)

**Files:** Create `src/lib/dashboard.ts`; удалить `src/lib/reminders.ts`.

**Interfaces:** `getDashboard()` → `{ activeCount, totalDue, monthRevenue, monthMargin, lowStock: Product[], recentOrders }`.

- [ ] **Step 1:** Реализация: выбрать активные заказы (deletedAt null) с items; посчитать
  через order-calc: activeCount (не COMPLETED/CANCELLED/RETURN), totalDue (Σ остатков),
  monthRevenue/monthMargin (заказы этого месяца по createdAt, не отменённые); lowStock —
  `product.findMany where stock<=minStock` (сравнение полей — Prisma не умеет напрямую,
  выбрать все активные товары и отфильтровать в коде); recentOrders — последние 8.
- [ ] **Step 2: Commit** — `feat(gs): выборки дашборда (KPI, низкий остаток, последние)`

---

### Task 9: Навигация и общие компоненты

**Files:** Rewrite `src/components/nav.tsx`; Create/rewrite badges & cards.

**Interfaces:** NAV: Дашборд `/`, Сделки `/orders`, Склад `/products`, Клиенты `/clients`
(+ Менеджеры). Компоненты: `OrderStatusBadge`, `PaymentBadge`, `OrderStatusStepper`
(client, вызывает setStatus), `OrderCard`, `ProductCard`, `ClientCard` (обновить),
`SearchInput`/`ConfirmDeleteButton`/`SubmitButton` (есть, переиспользовать),
`CategoryFilter`, `OrderStatusFilter`.

- [ ] **Step 1:** Обновить nav (4 пункта + иконки: дашборд/сделки/склад/клиенты; Менеджеры —
  в TopNav «ещё» или отдельная ссылка). Обновить корневой layout metadata (title
  «Glint & Steel»).
- [ ] **Step 2:** Реализовать бейджи/степпер/карточки/фильтры по интерфейсам.
- [ ] **Step 3: Commit** — `feat(gs): навигация, бейджи, карточки, фильтры`

---

### Task 10: Форма сделки (`src/components/OrderForm.tsx`)

**Files:** Create `src/components/OrderForm.tsx` (client), `src/components/OrderItemsEditor.tsx` (client).

**Interfaces:** `OrderForm({ action, clients, managers, products, defaults, submitLabel })`.
Позиции — локальный state (массив), редактор строк: выбор товара (поиск по каталогу →
подставляет sku/name/unitPrice/unitCost), qty, скидка (тип+значение); показ суммы строки
и итогов (через order-calc на клиенте). При сабмите — сериализовать позиции в hidden
`items` (JSON). Клиент: выбор существующего или инлайн (имя+телефон → создаётся при сабмите
через скрытые поля `newClientName`/`newClientPhone`, action решает). Оплата (способ+сумма),
доставка (радио самовывоз/доставка; при доставке показать адрес/трек).

- [ ] **Step 1:** OrderItemsEditor: добавление/удаление строк, автоподстановка из products,
  живой пересчёт (order-calc), предупреждение если qty>stock.
- [ ] **Step 2:** OrderForm: собрать всё, hidden `items` JSON, показ итога/маржи, SubmitButton.
- [ ] **Step 3: Commit** — `feat(gs): форма сделки с позициями из каталога и живым пересчётом`

---

### Task 11: Страницы сделок

**Files:** `src/app/(app)/orders/page.tsx`, `orders/new/page.tsx`, `orders/[id]/page.tsx`, `orders/[id]/edit/page.tsx`.

- [ ] **Step 1:** `/orders` — список (поиск номер/клиент, фильтр статус), карточки, «+ Новая сделка».
- [ ] **Step 2:** `/orders/new` — грузит clients/managers/products, `OrderForm action={createOrder}`.
- [ ] **Step 3:** `/orders/[id]` — карточка: позиции с суммами, итог/оплачено/остаток, маржа
  (себестоимость/маржа/%), оплата, доставка, `OrderStatusStepper`, правка, удаление.
- [ ] **Step 4:** `/orders/[id]/edit` — OrderForm с предзаполнением, `updateOrder.bind`.
- [ ] **Step 5:** проверка dev + **Commit** — `feat(gs): страницы сделок`

---

### Task 12: Страницы склада

**Files:** `src/app/(app)/products/page.tsx`, `products/new/page.tsx`, `products/[id]/page.tsx`, `products/[id]/edit/page.tsx`; `src/components/ProductForm.tsx`.

- [ ] **Step 1:** ProductForm (sku, name, category select, price, cost, stock, minStock, location).
- [ ] **Step 2:** `/products` — список (поиск, `CategoryFilter`, низкий остаток красным), «+ Товар».
- [ ] **Step 3:** new/[id]/edit страницы.
- [ ] **Step 4:** проверка + **Commit** — `feat(gs): страницы склада`

---

### Task 13: Клиенты и менеджеры

**Files:** обновить `src/components/ClientForm.tsx` + страницы клиентов; Create `src/components/ManagerForm.tsx`, `src/app/(app)/managers/page.tsx`.

- [ ] **Step 1:** ClientForm — поля name/phone/company/source (убрать address/notes).
  Обновить страницы клиентов (список показывает компанию; карточка — сделки клиента).
- [ ] **Step 2:** `/managers` — список + форма добавления (ManagerForm), деактивация/удаление.
- [ ] **Step 3: Commit** — `feat(gs): клиенты (компания/источник) и справочник менеджеров`

---

### Task 14: Дашборд

**Files:** `src/app/(app)/page.tsx`.

- [ ] **Step 1:** KPI-плитки (активные сделки, к оплате, выручка/маржа месяца), блок «Мало
  на складе» (красным), «Последние сделки». `force-dynamic`.
- [ ] **Step 2: Commit** — `feat(gs): дашборд с KPI, низким остатком и последними сделками`

---

### Task 15: Seed

**Files:** Rewrite `prisma/seed.ts`.

- [ ] **Step 1:** Очистка; 3 менеджера; 4 клиента (с company/source); ~12 товаров по
  категориям (price/cost/stock/minStock, часть ≤ min); 6 сделок в разных статусах
  (включая SHIPPED со `stockDeductedAt` и списанным складом, PARTIAL-оплату, RETURN).
  Каждая сделка с 1–3 позициями (снимки из товаров).
- [ ] **Step 2:** `npm run db:seed` → успех.
- [ ] **Step 3: Commit** — `feat(gs): seed (менеджеры, клиенты, товары, сделки)`

---

### Task 16: README и финальная проверка

**Files:** `README.md`.

- [ ] **Step 1:** Обновить README под новую модель (сущности, автосписание, KPI, этап 2 — email).
- [ ] **Step 2:** `npm run test` (все тесты) → PASS.
- [ ] **Step 3:** `npm run build` → успех.
- [ ] **Step 4:** Рантайм-проверка: вход → создать сделку из каталога → перевести в
  «Отправлено» → убедиться, что остаток товара уменьшился → дашборд показывает KPI.
- [ ] **Step 5: Commit** — `docs(gs): README + финальная проверка этапа 1`

---

## Self-Review

**Покрытие spec:** модель (T1), enum-метки (T2), расчёты/маржа (T3), номер (T4),
валидация (T5), actions товары/менеджеры (T6), сделки+автосписание+клиенты (T7),
дашборд-выборки (T8), навигация/компоненты (T9), форма сделки (T10), страницы сделок
(T11), склад (T12), клиенты/менеджеры (T13), дашборд (T14), seed (T15), README+проверка
(T16). Все разделы spec покрыты.

**Плейсхолдеры:** чистая логика (T3–T5) с тестами и сигнатурами; UI — через интерфейсы
компонентов и критерии (осознанно не построчный JSX).

**Согласованность:** имена `lineTotal/orderTotal/orderCost/orderBalance/margin/marginPercent`,
`formatOrderNumber/nextOrderNumber`, `setStatus` (автосписание), enum-хелперы —
согласованы между задачами-производителями и потребителями.
