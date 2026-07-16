# Дизайн: CRM для мастера (мебель из нержавеющей стали)

Дата: 2026-07-16
Статус: одобрено пользователем

## Цель

Простая одно­пользовательская CRM для мастера, изготавливающего мебель из
нержавеющей стали (перила, столы, стеллажи, кухонные конструкции). Веб-приложение,
удобное с телефона (PWA), с учётом клиентов и заказов и напоминаниями «на сегодня».

## Решения (зафиксировано)

- **Стек:** Next.js 14 (App Router) + TypeScript + Tailwind CSS.
- **БД:** PostgreSQL через Prisma. Локально — docker-compose (порт **5434**, чтобы
  не конфликтовать с уже запущенными Postgres на 5432/5433). Прод — Neon (в README).
- **Мутации:** Server Actions с валидацией через zod.
- **Тема:** авто light/dark (`prefers-color-scheme` + Tailwind `dark:`).
- **Валюта:** рубль (₽), формат `12 500 ₽`. Легко заменить позже.
- **Авторизация:** один пароль (`APP_PASSWORD`) + подписанная httpOnly cookie-сессия
  на 30 дней (подпись HMAC секретом `SESSION_SECRET`). middleware защищает всё,
  кроме `/login`.

## Структура проекта

```
src/
  app/
    login/page.tsx                 — вход
    (app)/                         — группа защищённых страниц, общий layout с навигацией
      page.tsx                     — «Сегодня»
      orders/page.tsx              — список заказов
      orders/new/page.tsx          — новый заказ
      orders/[id]/page.tsx         — карточка заказа
      orders/[id]/edit/page.tsx    — редактирование заказа
      clients/page.tsx             — список клиентов
      clients/new/page.tsx         — новый клиент
      clients/[id]/page.tsx        — карточка клиента
      clients/[id]/edit/page.tsx   — редактирование клиента
      layout.tsx                   — layout с TopNav/BottomNav
    layout.tsx                     — корневой layout (html, метаданные, PWA)
    manifest.ts                    — PWA-манифест
    globals.css
  lib/
    prisma.ts                      — singleton Prisma client
    auth.ts                        — создание/проверка cookie-сессии (HMAC)
    validation.ts                  — zod-схемы Client/Order
    format.ts                      — деньги (12 500 ₽) и даты (15 июля 2026)
    reminders.ts                   — выборки для «Сегодня» (замеры/сроки/оплаты)
    status.ts                      — метки и цвета статусов
  components/
    StatusBadge.tsx, StatusStepper.tsx
    TopNav.tsx, BottomNav.tsx
    OrderCard.tsx, ClientCard.tsx
    OrderForm.tsx, ClientForm.tsx
    SearchInput.tsx, StatusFilter.tsx
    ConfirmDeleteButton.tsx, SubmitButton.tsx
  actions/
    auth.ts                        — login / logout
    orders.ts                      — createOrder/updateOrder/deleteOrder/setStatus
    clients.ts                     — createClient/updateClient/deleteClient
middleware.ts
prisma/
  schema.prisma
  seed.ts
public/                            — иконки PWA (192, 512, maskable), apple-touch-icon
docker-compose.yml
.env.example
README.md
```

## Модель данных (Prisma)

```prisma
enum Status { NEW MEASURE PRODUCTION INSTALL DONE }

model Client {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  address   String?
  notes     String?
  createdAt DateTime @default(now())
  orders    Order[]
}

model Order {
  id          String    @id @default(cuid())
  clientId    String
  client      Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  title       String
  description String?
  status      Status    @default(NEW)
  price       Decimal   @default(0) @db.Decimal(12, 2)
  prepaid     Decimal   @default(0) @db.Decimal(12, 2)
  measureDate DateTime?
  dueDate     DateTime?
  notes       String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

- Остаток к оплате = `price - prepaid` — не хранится, считается в коде.
- Decimal обрабатывается аккуратно (без потери копеек) при передаче из БД в UI.
- Удаление клиента каскадно удаляет его заказы.

## Страницы

1. **/login** — поле «Пароль» → Server Action сверяет с `APP_PASSWORD`, ставит cookie.
2. **/ (Сегодня)** — три блока:
   - «Замеры»: `measureDate ≤ конец сегодня` и `status ≠ DONE`; просроченные красным.
   - «Сроки сдачи»: `dueDate ≤ сегодня+3 дня` (включая просроченные) и `status ≠ DONE`;
     просроченные красным.
   - «Ждут оплаты»: `status = DONE` и остаток > 0.
   - Счётчики: заказов в работе (≠ DONE); сумма остатков к оплате.
   - Границы дня — по локальной таймзоне сервера.
3. **/orders** — карточки (название, клиент, бейдж статуса, сумма/остаток, срок).
   Фильтр по статусу, поиск по названию заказа и имени клиента. Кнопка «+ Новый заказ».
4. **/orders/[id]** — все поля; смена статуса кнопками-шагами воронки (один тап);
   редактирование; удаление с подтверждением.
5. **/clients** — список с поиском, «+ Новый клиент».
6. **/clients/[id]** — данные, кнопка «Позвонить» (`tel:`), список заказов клиента,
   редактирование, удаление (с предупреждением о каскадном удалении заказов).

## Интерфейс

- Mobile-first, крупные кнопки. Нижняя навигация (Сегодня / Заказы / Клиенты) на
  мобильном, верхнее меню на десктопе.
- Цвета статусов: NEW серый · MEASURE синий · PRODUCTION оранжевый · INSTALL
  фиолетовый · DONE зелёный.
- Форматы: `Intl.NumberFormat('ru-RU')` для сумм; даты — «15 июля 2026».
- Авто light/dark. PWA: manifest, иконки, theme-color, apple-mobile-web-app-*.

## Качество и проверка

- zod-валидация во всех Server Actions; ошибки возвращаются в форму.
- Seed: 3 клиента, 5 заказов в разных статусах, включая просроченный замер, близкий
  срок сдачи и завершённый заказ с остатком — чтобы «Сегодня» сразу наполнилась.
- README.md (рус): локальный запуск, создание базы на Neon, деплой на Vercel, env.
- `.env.example`: `DATABASE_URL`, `APP_PASSWORD`, `SESSION_SECRET`.
- Финальная проверка: `prisma migrate` + `seed` на локальном docker Postgres,
  затем `npm run build` без ошибок.

## Отступления от исходной спеки

- Добавлен `SESSION_SECRET` — секрет для HMAC-подписи cookie-сессии (иначе httpOnly
  cookie можно подделать). Единственное отступление; остальное строго по спеке.
```
