# Дизайн: Glint & Steel — этап 2 (вход по email + роли)

Дата: 2026-07-18
Статус: одобрено пользователем

## Решения

- Вход по **email + пароль** (пароли хешируются, PBKDF2 через Web Crypto).
- Роли: **админ** и **менеджер**; админ может выдать менеджеру админ-права (`isAdmin`).
- Общий `APP_PASSWORD` **убирается**. Первый админ — через seed (env для прод-смены).
- Менеджер сделки = **вошедший пользователь** (автоподстановка).
- Сессия хранит id вошедшего менеджера (подписанный HMAC-токен, как сейчас).

## Модель (Prisma) — расширение Manager

```prisma
model Manager {
  id           String    @id @default(cuid())
  name         String
  email        String?   @unique
  passwordHash String?
  isAdmin      Boolean   @default(false)
  active       Boolean   @default(true)
  createdAt    DateTime  @default(now())
  deletedAt    DateTime?
  orders       Order[]
  @@index([deletedAt])
}
```

Менеджер с `email`+`passwordHash` может входить; без них — справочная запись.

## Авторизация

- `src/lib/password.ts`: `hashPassword(pw)` → `salt:hash` (PBKDF2-SHA256, 100k итераций);
  `verifyPassword(pw, stored)` → bool. Web Crypto, без зависимостей. Покрыто тестами.
- `src/lib/auth.ts`:
  - `signSession(payload)` → `payload.hmac`; `verifySession(token, secret)` → `payload | null`
    (теперь возвращает id, а не bool).
  - `createSession(managerId)`, `destroySession()`, `getSessionManagerId()`,
    `getCurrentManager()` (prisma по id, deletedAt null), `requireManager()`,
    `requireAdmin()`.
- `middleware.ts`: `verifySession` → id; нет id → redirect `/login`.
- `/login`: email + пароль. `login` action ищет менеджера по email, `verifyPassword`,
  ставит сессию. Ошибка — «Неверный email или пароль».

## Разграничение прав

| Возможность | Админ | Менеджер |
|---|---|---|
| Сделки, клиенты (CRUD) | ✅ | ✅ |
| Каталог и остатки склада (просмотр) | ✅ | ✅ |
| Себестоимость и маржа (товары, сделки, дашборд) | ✅ | ❌ |
| Выручка/маржа за месяц (дашборд) | ✅ | ❌ |
| Управление складом (создать/править товар) | ✅ | ❌ |
| Управление менеджерами + выдача админ-прав | ✅ | ❌ |

- Защита на сервере: actions `createProduct/updateProduct/deleteProduct`,
  `createManager/deleteManager/setManagerAdmin` — `requireAdmin()`; страницы
  `/products/new`, `/products/[id]/edit`, `/managers` — редирект не-админа.
- UI: `getCurrentManager()` в layout/страницах; проп `isAdmin`/`canSeeMargin`
  скрывает себестоимость/маржу и кнопки управления. Пункт «Менеджеры» в навигации —
  только админу.

## Автоподстановка менеджера

`createOrder` ставит `managerId = getCurrentManager().id`. Поле выбора менеджера из
формы сделки убирается. `updateOrder` сохраняет исходного менеджера.

## Seed / первый вход

3 менеджера с email и паролем по умолчанию (`changeme`), первый (`admin@glint.kz`) —
админ. README: сменить пароли. Для прод — env `ADMIN_EMAIL`/`ADMIN_PASSWORD` (описать).

## env

Убрать `APP_PASSWORD`. Оставить `DATABASE_URL`, `SESSION_SECRET`. Опционально
`ADMIN_EMAIL`/`ADMIN_PASSWORD` для первичного админа при деплое.
