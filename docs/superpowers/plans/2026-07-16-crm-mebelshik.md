# CRM для мебельщика — план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Рабочая одно­пользовательская CRM (клиенты + заказы + напоминания «Сегодня») на Next.js 14, PWA, деплой на Vercel.

**Architecture:** Единый Next.js 14 (App Router) проект. Мутации — Server Actions с zod. Данные — Postgres через Prisma (локально docker-compose, прод Neon). Авторизация — один пароль + подписанная httpOnly cookie-сессия, защита через middleware. Чистая логика (форматирование, подпись сессии, выборки напоминаний, валидация) вынесена в `src/lib` и покрыта unit-тестами (vitest).

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL, zod, vitest.

## Global Constraints

- Интерфейс полностью на русском.
- Один пользователь; пароль из `APP_PASSWORD`.
- Cookie-сессия: httpOnly + secure + SameSite=Lax, срок 30 дней, подпись HMAC-SHA256 секретом `SESSION_SECRET`.
- Prisma models строго по спеке; enum `Status = NEW | MEASURE | PRODUCTION | INSTALL | DONE`.
- Остаток = `price - prepaid` — не хранится, считается в коде; деньги без потери копеек.
- Форматы: суммы `Intl.NumberFormat('ru-RU')` → `12 500 ₽`; даты → `15 июля 2026`.
- Цвета статусов: NEW серый · MEASURE синий · PRODUCTION оранжевый · INSTALL фиолетовый · DONE зелёный.
- Mobile-first: нижняя навигация на мобильном, верхняя на десктопе; крупные кнопки. Авто light/dark.
- Локальный Postgres — порт **5434** (5432/5433 заняты).
- env: `DATABASE_URL`, `APP_PASSWORD`, `SESSION_SECRET`.
- Все страницы, кроме `/login`, — динамические (зависят от cookie); недоступны без сессии.

---

### Task 1: Инициализация проекта и инфраструктура

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`, `.gitignore`, `.env.example`, `.env`, `docker-compose.yml`, `vitest.config.ts`, `src/app/globals.css`

**Interfaces:**
- Produces: рабочее Next.js-приложение, поднятый локальный Postgres, настроенный vitest.

- [ ] **Step 1: package.json** — зависимости и скрипты:

```json
{
  "name": "crm-mebelshik",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "db:up": "docker compose up -d",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "postinstall": "prisma generate"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@prisma/client": "5.18.0",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "@types/node": "20.14.15",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "prisma": "5.18.0",
    "tailwindcss": "3.4.9",
    "postcss": "8.4.41",
    "autoprefixer": "10.4.20",
    "tsx": "4.17.0",
    "vitest": "2.0.5",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5"
  }
}
```

- [ ] **Step 2: docker-compose.yml** (порт 5434):

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: crm-mebelshik-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: crm
      POSTGRES_PASSWORD: crm
      POSTGRES_DB: crm
    ports:
      - "5434:5432"
    volumes:
      - crm-db-data:/var/lib/postgresql/data
volumes:
  crm-db-data:
```

- [ ] **Step 3: .env.example** и `.env` (для локали):

```
DATABASE_URL="postgresql://crm:crm@localhost:5434/crm?schema=public"
APP_PASSWORD="changeme"
SESSION_SECRET="dev-secret-change-in-production-please-32chars-min"
```

- [ ] **Step 4:** tsconfig (paths `@/*` → `src/*`), next.config.mjs, tailwind.config.ts (`darkMode: 'media'`, content `./src/**/*.{ts,tsx}`), postcss, eslint, .gitignore (node_modules, .next, .env), globals.css (директивы tailwind + базовые стили body), vitest.config.ts (environment node).

- [ ] **Step 5: установка и старт БД**

Run: `npm install && npm run db:up`
Expected: зависимости установлены, контейнер `crm-mebelshik-db` запущен (`docker ps` показывает порт 5434).

- [ ] **Step 6: Commit** — `chore: инициализация проекта, tailwind, docker postgres`

---

### Task 2: Prisma schema, миграция, клиент

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`

**Interfaces:**
- Produces: `import { prisma } from '@/lib/prisma'`; типы `Client`, `Order`, enum `Status` из `@prisma/client`.

- [ ] **Step 1: schema.prisma** (datasource postgres из env, generator client) с моделями `Client`/`Order` и enum `Status` строго по спеке (см. дизайн-док: cuid id, Decimal(12,2), `onDelete: Cascade`, `@updatedAt`).

- [ ] **Step 2: src/lib/prisma.ts** — singleton:

```ts
import { PrismaClient } from '@prisma/client'
const g = globalThis as unknown as { prisma?: PrismaClient }
export const prisma = g.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') g.prisma = prisma
```

- [ ] **Step 3: миграция**

Run: `npm run db:migrate -- --name init`
Expected: создана папка `prisma/migrations/*_init`, таблицы `Client`/`Order` в БД, без ошибок.

- [ ] **Step 4: Commit** — `feat: prisma schema и миграция init`

---

### Task 3: Форматирование денег и дат (TDD)

**Files:**
- Create: `src/lib/format.ts`, `src/lib/format.test.ts`

**Interfaces:**
- Produces: `formatMoney(v: Prisma.Decimal | number | string): string`, `formatDate(d: Date | string): string`, `balance(price, prepaid): number`.

- [ ] **Step 1: тест** `format.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatMoney, formatDate, balance } from './format'

describe('formatMoney', () => {
  it('форматирует рубли с разделителями', () => {
    expect(formatMoney(12500)).toBe('12 500 ₽')
  })
  it('принимает строку Decimal', () => {
    expect(formatMoney('0')).toBe('0 ₽')
  })
})
describe('balance', () => {
  it('считает остаток', () => {
    expect(balance(10000, 3000)).toBe(7000)
  })
})
describe('formatDate', () => {
  it('форматирует по-русски', () => {
    expect(formatDate('2026-07-15T00:00:00')).toBe('15 июля 2026')
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/lib/format.test.ts` → FAIL (нет модуля).

- [ ] **Step 3: реализация** `format.ts` — `formatMoney` через `Intl.NumberFormat('ru-RU',{maximumFractionDigits:0}).format(Math.round(Number(v)))` + ` ₽` (узкий пробел ` ` внутри числа, обычный перед ₽); `formatDate` через `Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'})`; `balance = Number(price) - Number(prepaid)`. Учесть, что тест ожидает обычные пробелы — привести ` `/` ` к обычному пробелу перед возвратом, чтобы формат был предсказуем.

- [ ] **Step 4:** Run `npx vitest run src/lib/format.test.ts` → PASS.

- [ ] **Step 5: Commit** — `feat: форматирование денег и дат + тесты`

---

### Task 4: Статусы (метки и цвета)

**Files:**
- Create: `src/lib/status.ts`

**Interfaces:**
- Produces: `STATUS_ORDER: Status[]`, `statusLabel(s): string`, `statusBadgeClass(s): string` (Tailwind-классы фона/текста для light+dark), `nextStatus(s): Status | null`.

- [ ] **Step 1:** реализация: массив порядка `[NEW,MEASURE,PRODUCTION,INSTALL,DONE]`; метки `Заявка/Замер/Производство/Монтаж/Завершён`; классы бейджей — серый/синий/оранжевый/фиолетовый/зелёный с вариантами `dark:`; `nextStatus` — следующий по воронке или null для DONE.

- [ ] **Step 2: Commit** — `feat: метки и цвета статусов`

---

### Task 5: Подпись cookie-сессии (TDD)

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth.test.ts`

**Interfaces:**
- Produces: `signSession(secret: string): string`, `verifySession(token: string, secret: string): boolean`, `SESSION_COOKIE = 'crm_session'`, `createSession()` / `destroySession()` (ставят/чистят cookie через `next/headers`), `isAuthed(): boolean`.
- Consumes: env `SESSION_SECRET`.

- [ ] **Step 1: тест** (только чистые функции подписи):

```ts
import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from './auth'

describe('session token', () => {
  const s = 'test-secret-0123456789abcdef'
  it('подписанный токен проходит проверку', () => {
    expect(verifySession(signSession(s), s)).toBe(true)
  })
  it('чужой секрет не проходит', () => {
    expect(verifySession(signSession(s), 'other-secret')).toBe(false)
  })
  it('мусорный токен не проходит', () => {
    expect(verifySession('garbage', s)).toBe(false)
  })
})
```

- [ ] **Step 2:** Run `npx vitest run src/lib/auth.test.ts` → FAIL.

- [ ] **Step 3: реализация** — токен = `payload.hmac`, где `payload='v1'` (или timestamp), `hmac=HMAC_SHA256(payload, secret)` в hex (модуль `node:crypto`); `verifySession` пересчитывает и сравнивает через `crypto.timingSafeEqual`, аккуратно ловит исключения (garbage → false). Cookie-функции (`createSession/destroySession/isAuthed`) используют `cookies()` из `next/headers`, cookie httpOnly+secure+sameSite lax, maxAge 30 дней; помечены так, чтобы не мешать unit-тесту чистых функций.

- [ ] **Step 4:** Run `npx vitest run src/lib/auth.test.ts` → PASS.

- [ ] **Step 5: Commit** — `feat: подпись cookie-сессии + тесты`

---

### Task 6: Middleware защиты

**Files:**
- Create: `middleware.ts`

**Interfaces:**
- Consumes: `verifySession`, `SESSION_COOKIE`.

- [ ] **Step 1:** middleware: если путь `/login`, `/manifest.webmanifest`, статика, иконки — пропускать; иначе читать cookie `crm_session`, проверять `verifySession(token, process.env.SESSION_SECRET!)`; при провале — `NextResponse.redirect('/login')`. `config.matcher` исключает `_next`, статику, иконки.

- [ ] **Step 2: проверка** — `npm run dev`, зайти на `/` без cookie → редирект на `/login`. Остановить dev.

- [ ] **Step 3: Commit** — `feat: middleware защиты маршрутов`

---

### Task 7: Авторизация — action + страница /login

**Files:**
- Create: `src/actions/auth.ts`, `src/app/login/page.tsx`, `src/components/SubmitButton.tsx`

**Interfaces:**
- Produces: `login(prevState, formData): Promise<{error?: string}>`, `logout(): Promise<void>`.
- Consumes: `createSession/destroySession` из `@/lib/auth`, `APP_PASSWORD`.

- [ ] **Step 1: actions/auth.ts** (`'use server'`) — `login`: zod-проверка непустого пароля, сравнение с `process.env.APP_PASSWORD`; при совпадении `createSession()` + `redirect('/')`; иначе вернуть `{error:'Неверный пароль'}`. `logout`: `destroySession()` + `redirect('/login')`.

- [ ] **Step 2: SubmitButton.tsx** (`'use client'`) — кнопка с `useFormStatus`, disabled+«…» во время отправки.

- [ ] **Step 3: login/page.tsx** — центрированная форма (одно поле password, крупная кнопка «Войти»), `useFormState(login)`, показ ошибки. Заголовок «CRM · Вход».

- [ ] **Step 4: проверка** — dev: неверный пароль → ошибка; верный → редирект на `/`, ставится cookie.

- [ ] **Step 5: Commit** — `feat: вход по паролю и cookie-сессия`

---

### Task 8: Валидация (zod) — TDD

**Files:**
- Create: `src/lib/validation.ts`, `src/lib/validation.test.ts`

**Interfaces:**
- Produces: `clientSchema`, `orderSchema` (+ типы `ClientInput`, `OrderInput`); helper `parseClient(formData)`, `parseOrder(formData)` → `{success, data?, errors?}`.

- [ ] **Step 1: тест** — `clientSchema`: пустое имя → ошибка; валидное имя → ок, пустые phone/address/notes → `null`/undefined. `orderSchema`: пустой title → ошибка; `price`/`prepaid` парсятся из строк («12500», «12 500» → число), отрицательные → ошибка; даты пустые → null; `clientId` обязателен.

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: реализация** — zod-схемы; preprocess для чисел (убрать пробелы/₽, `Number`), для дат (пустая строка → null, иначе `new Date`), для строк (trim, пустая → null). Helpers читают из `FormData`.

- [ ] **Step 4:** Run → PASS.

- [ ] **Step 5: Commit** — `feat: zod-валидация клиентов и заказов + тесты`

---

### Task 9: Server Actions — клиенты

**Files:**
- Create: `src/actions/clients.ts`

**Interfaces:**
- Produces: `createClient(prevState, formData)`, `updateClient(id, prevState, formData)`, `deleteClient(id)`. Возвращают `{error?, fieldErrors?}`; при успехе `revalidatePath` + `redirect`.
- Consumes: `prisma`, `parseClient`.

- [ ] **Step 1:** реализация всех трёх (`'use server'`): валидация через `parseClient`; create/update через `prisma.client`; delete — `prisma.client.delete` (каскад удалит заказы); revalidate `/clients`, `/`, `redirect` на карточку/список.

- [ ] **Step 2: Commit** — `feat: server actions для клиентов`

---

### Task 10: Server Actions — заказы

**Files:**
- Create: `src/actions/orders.ts`

**Interfaces:**
- Produces: `createOrder(prevState, formData)`, `updateOrder(id, prevState, formData)`, `deleteOrder(id)`, `setStatus(id, status)`. 
- Consumes: `prisma`, `parseOrder`, `Status`.

- [ ] **Step 1:** реализация: create/update с `parseOrder` (price/prepaid как Decimal-совместимые строки/числа, даты nullable); `setStatus` — обновляет только `status` (валидировать через `z.nativeEnum(Status)`); delete. Везде revalidate `/orders`, `/`, соответствующей карточки.

- [ ] **Step 2: Commit** — `feat: server actions для заказов + смена статуса`

---

### Task 11: Выборки для «Сегодня» (TDD)

**Files:**
- Create: `src/lib/reminders.ts`, `src/lib/reminders.test.ts`

**Interfaces:**
- Produces: чистые предикаты для тестируемости — `isMeasureReminder(order, now)`, `isDueReminder(order, now)`, `isAwaitingPayment(order)`, `isOverdue(date, now)`; и async `getToday()` возвращающий `{measures, dues, awaiting, inWorkCount, totalBalance}` через prisma.

- [ ] **Step 1: тест** предикатов с фиксированным `now`:

```ts
// measure: measureDate <= конец сегодня и status != DONE
// due: dueDate <= now+3д (или просрочен) и status != DONE
// awaiting: status == DONE и balance > 0
// overdue: date < начало сегодня
```
Полные кейсы: сегодня, вчера (просрочен), через 2 дня, через 5 дней, DONE.

- [ ] **Step 2:** Run → FAIL.

- [ ] **Step 3: реализация** предикатов (границы дня через локальные `startOfDay/endOfDay`) + `getToday()` (запросы prisma, сортировка по дате, подсчёт `inWorkCount` и суммы остатков).

- [ ] **Step 4:** Run → PASS.

- [ ] **Step 5: Commit** — `feat: логика напоминаний «Сегодня» + тесты`

---

### Task 12: Каркас навигации и общий layout

**Files:**
- Create: `src/components/TopNav.tsx`, `src/components/BottomNav.tsx`, `src/app/(app)/layout.tsx`, `src/app/layout.tsx`

**Interfaces:**
- Produces: защищённый layout с навигацией; корневой layout с метаданными и PWA-мета.
- Consumes: `logout` из `@/actions/auth`.

- [ ] **Step 1: root layout** — `<html lang="ru">`, метаданные (title «CRM Мебель», description), `theme-color`, apple-mobile-web-app-*, подключение globals.css, шрифт.

- [ ] **Step 2: TopNav/BottomNav** — три пункта (Сегодня `/`, Заказы `/orders`, Клиенты `/clients`) с активным состоянием (`usePathname`); BottomNav фиксирован снизу и виден только `md:hidden`; TopNav только `hidden md:flex`; кнопка «Выйти» (form → logout).

- [ ] **Step 3: (app)/layout.tsx** — оборачивает контент, рендерит TopNav сверху и BottomNav снизу, добавляет нижний отступ под мобильную панель.

- [ ] **Step 4: Commit** — `feat: навигация и общий layout`

---

### Task 13: Переиспользуемые UI-компоненты

**Files:**
- Create: `src/components/StatusBadge.tsx`, `src/components/StatusStepper.tsx`, `src/components/OrderCard.tsx`, `src/components/ClientCard.tsx`, `src/components/SearchInput.tsx`, `src/components/StatusFilter.tsx`, `src/components/ConfirmDeleteButton.tsx`

**Interfaces:**
- Produces:
  - `StatusBadge({status})` — цветной бейдж (`statusBadgeClass`, `statusLabel`).
  - `StatusStepper({orderId, status})` (client) — кнопки-шаги воронки, тап вызывает `setStatus`.
  - `OrderCard({order})` — название, клиент, бейдж, сумма/остаток, срок; ссылка на `/orders/[id]`.
  - `ClientCard({client})` — имя, телефон; ссылка на `/clients/[id]`.
  - `SearchInput` (client) — поле поиска, пишет в query-параметр `q` (`useRouter`/`useSearchParams`).
  - `StatusFilter` (client) — селект/чипы, пишет в query `status`.
  - `ConfirmDeleteButton({action, label})` (client) — кнопка с `confirm()` перед вызовом server action.

- [ ] **Step 1:** реализовать компоненты по интерфейсам выше (крупные тап-таргеты, dark-варианты, форматтеры из `@/lib/format`).

- [ ] **Step 2: Commit** — `feat: переиспользуемые UI-компоненты`

---

### Task 14: Страница «Сегодня»

**Files:**
- Create: `src/app/(app)/page.tsx`

**Interfaces:**
- Consumes: `getToday()`, `OrderCard`/списки, форматтеры.

- [ ] **Step 1:** серверный компонент: `getToday()`, три блока-карточки (Замеры / Сроки сдачи / Ждут оплаты) с заголовком и счётчиком; просроченные строки красным; сверху две плашки-счётчика (в работе, сумма остатков). Пустые блоки — «Нет напоминаний». `export const dynamic = 'force-dynamic'`.

- [ ] **Step 2: проверка** — dev: страница открывается, блоки рендерятся (данные появятся после seed в Task 18).

- [ ] **Step 3: Commit** — `feat: главная страница «Сегодня»`

---

### Task 15: Страницы заказов

**Files:**
- Create: `src/app/(app)/orders/page.tsx`, `src/app/(app)/orders/new/page.tsx`, `src/app/(app)/orders/[id]/page.tsx`, `src/app/(app)/orders/[id]/edit/page.tsx`, `src/components/OrderForm.tsx`

**Interfaces:**
- Consumes: actions заказов, `parseOrder`, компоненты.

- [ ] **Step 1: OrderForm** (client) — поля: клиент (select из переданного списка), title, description, status, price, prepaid, measureDate, dueDate, notes; `useFormState` на переданный action; показ ошибок полей; крупная кнопка сохранить (`SubmitButton`).

- [ ] **Step 2: orders/page.tsx** — читает `searchParams` (`q`, `status`), фильтрует запрос prisma (по названию и имени клиента, по статусу), рендерит `SearchInput`+`StatusFilter`+список `OrderCard`, кнопка «+ Новый заказ». `force-dynamic`.

- [ ] **Step 3: orders/new/page.tsx** — грузит клиентов, рендерит `OrderForm` с `createOrder`.

- [ ] **Step 4: orders/[id]/page.tsx** — карточка: все поля, `StatusStepper`, суммы/остаток, даты; кнопки «Редактировать» и `ConfirmDeleteButton(deleteOrder)`.

- [ ] **Step 5: orders/[id]/edit/page.tsx** — `OrderForm` с предзаполнением и `updateOrder.bind(null,id)`.

- [ ] **Step 6: проверка** — dev: создать/открыть/сменить статус/отредактировать/удалить заказ.

- [ ] **Step 7: Commit** — `feat: страницы заказов (список, создание, карточка, редактирование)`

---

### Task 16: Страницы клиентов

**Files:**
- Create: `src/app/(app)/clients/page.tsx`, `src/app/(app)/clients/new/page.tsx`, `src/app/(app)/clients/[id]/page.tsx`, `src/app/(app)/clients/[id]/edit/page.tsx`, `src/components/ClientForm.tsx`

**Interfaces:**
- Consumes: actions клиентов, компоненты.

- [ ] **Step 1: ClientForm** (client) — поля name/phone/address/notes, `useFormState`, ошибки, `SubmitButton`.

- [ ] **Step 2: clients/page.tsx** — поиск по имени (`q`), список `ClientCard`, «+ Новый клиент». `force-dynamic`.

- [ ] **Step 3: clients/new/page.tsx** — `ClientForm` с `createClient`.

- [ ] **Step 4: clients/[id]/page.tsx** — данные, кнопка «Позвонить» (`tel:`, только если есть phone), список заказов клиента (`OrderCard`), «Редактировать», `ConfirmDeleteButton(deleteClient)` с предупреждением о заказах.

- [ ] **Step 5: clients/[id]/edit/page.tsx** — `ClientForm` с предзаполнением и `updateClient.bind(null,id)`.

- [ ] **Step 6: проверка** — dev: CRUD клиента, звонок-ссылка, каскадное удаление.

- [ ] **Step 7: Commit** — `feat: страницы клиентов (список, создание, карточка, редактирование)`

---

### Task 17: PWA (manifest + иконки)

**Files:**
- Create: `src/app/manifest.ts`, `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`

**Interfaces:**
- Produces: валидный web app manifest, устанавливаемое PWA.

- [ ] **Step 1: иконки** — сгенерировать простые PNG-иконки (монограмма/квадрат бренда) нужных размеров скриптом (node/canvas или заранее собранный base64→файл). Размеры 192, 512, maskable 512, apple-touch 180.

- [ ] **Step 2: manifest.ts** — `name: 'CRM Мебель'`, `short_name: 'CRM'`, `start_url: '/'`, `display: 'standalone'`, `background_color`/`theme_color`, `icons` (в т.ч. `purpose: 'maskable'`). Ссылка apple-touch-icon в root layout.

- [ ] **Step 3: проверка** — dev: `/manifest.webmanifest` отдаётся, DevTools → Application → манифест валиден, иконки видны.

- [ ] **Step 4: Commit** — `feat: PWA манифест и иконки`

---

### Task 18: Seed

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Consumes: `PrismaClient`, `Status`.

- [ ] **Step 1:** seed: очистка таблиц; 3 клиента; 5 заказов в разных статусах, включая: замер с `measureDate` = сегодня и один просроченный; заказ с `dueDate` через 2 дня; заказ DONE с `prepaid < price` (ждёт оплаты); заказ PRODUCTION. Реалистичные русские данные (перила, стол, стеллаж, кухня).

- [ ] **Step 2: прогон**

Run: `npm run db:seed`
Expected: «Seed завершён», без ошибок; в БД 3 клиента и 5 заказов.

- [ ] **Step 3: проверка «Сегодня»** — dev: на главной видны замеры/сроки/ожидающие оплаты.

- [ ] **Step 4: Commit** — `feat: seed с тестовыми данными`

---

### Task 19: README и .env.example

**Files:**
- Create: `README.md`
- Modify: `.env.example` (проверить полноту)

**Interfaces:** —

- [ ] **Step 1: README.md** (рус): описание; требования (Node, Docker); локальный запуск (`npm install`, `npm run db:up`, `npm run db:migrate`, `npm run db:seed`, `npm run dev`); создание базы на Neon (регистрация, скопировать `DATABASE_URL`); деплой на Vercel (импорт, env-переменные `DATABASE_URL`/`APP_PASSWORD`/`SESSION_SECRET`, `prisma migrate deploy`); таблица переменных окружения; вход по паролю.

- [ ] **Step 2: Commit** — `docs: README и .env.example`

---

### Task 20: Финальная проверка

**Files:** —

- [ ] **Step 1: все тесты** — `npm run test` → PASS.

- [ ] **Step 2: сборка** — `npm run build` → успешно, без ошибок типов/линта.

- [ ] **Step 3: миграция и seed с нуля** (проверка воспроизводимости) — при необходимости `prisma migrate reset` + seed.

- [ ] **Step 4: ручной прогон** — login → «Сегодня» → создать клиента → создать заказ → сменить статусы → удалить. Всё работает.

- [ ] **Step 5: Commit** — `chore: финальная проверка сборки` (если были правки).

---

## Self-Review (проведено)

**Покрытие спеки:** авторизация (T5-T7, middleware T6), модель данных (T2), «Сегодня» (T11, T14), /orders (T15), /orders/[id] со сменой статуса/удалением (T13 stepper, T15), /clients + /clients/[id] с tel: и каскадом (T16), mobile-first навигация (T12), цвета/форматы (T3, T4, T13), Server Actions + zod (T8-T10), seed (T18), README + .env.example (T19), PWA (T17), migrate/seed/build (T1, T2, T18, T20). Пробелов нет.

**Плейсхолдеры:** для чистой логики (T3, T5, T8, T11) заданы конкретные тесты и сигнатуры; UI-задачи описаны через интерфейсы компонентов и критерии проверки (осознанно не построчный JSX, т.к. это скаффолдинг — проверяется сборкой и ручным прогоном).

**Согласованность типов:** `Status`, `balance`, `formatMoney/formatDate`, `signSession/verifySession`, `parseClient/parseOrder`, `getToday`, `setStatus` — имена совпадают между задачами-производителями и потребителями.
