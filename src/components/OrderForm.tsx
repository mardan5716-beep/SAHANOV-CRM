'use client'

import { useEffect, useRef, useState } from 'react'
import { useFormState } from 'react-dom'
import {
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  DeliveryMethod,
  DiscountType,
} from '@prisma/client'
import {
  ORDER_STATUS_ORDER,
  PAYMENT_STATUS_ORDER,
  PAYMENT_METHOD_ORDER,
  orderStatusLabel,
  paymentStatusLabel,
  paymentMethodLabel,
} from '@/lib/enums'
import { formatMoney } from '@/lib/format'
import { lineTotal, orderTotal, orderCost, orderBalance, margin, marginPercent } from '@/lib/order-calc'
import { SubmitButton } from './SubmitButton'
import type { OrderFormState } from '@/actions/orders'

export type ProductOption = {
  id: string
  sku: string
  name: string
  price: number
  cost: number
  stock: number
}
type Named = { id: string; name: string }

type Item = {
  key: string
  productId: string
  sku: string
  name: string
  unitPrice: number
  unitCost: number
  qty: number
  discountType: DiscountType
  discountValue: number
}

export type OrderDefaults = {
  clientId?: string
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  paymentMethod?: PaymentMethod | null
  paid?: number
  deliveryMethod?: DeliveryMethod
  deliveryAddress?: string | null
  deliveryCost?: number
  trackNumber?: string | null
  notes?: string | null
  items?: Omit<Item, 'key'>[]
}

const inputClass =
  'w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-700 dark:bg-gray-900'
const labelClass = 'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'

export function OrderForm({
  action,
  clients,
  products,
  defaults = {},
  submitLabel,
  canSeeMargin = false,
}: {
  action: (state: OrderFormState, formData: FormData) => Promise<OrderFormState>
  clients: Named[]
  products: ProductOption[]
  defaults?: OrderDefaults
  submitLabel: string
  canSeeMargin?: boolean
}) {
  const [state, formAction] = useFormState(action, {} as OrderFormState)
  const keyRef = useRef(0)
  const newKey = () => `k${keyRef.current++}`

  const [clientMode, setClientMode] = useState<'existing' | 'new'>(
    defaults.clientId ? 'existing' : clients.length ? 'existing' : 'new',
  )
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(
    defaults.deliveryMethod ?? DeliveryMethod.PICKUP,
  )
  const [deliveryCost, setDeliveryCost] = useState<string>(
    defaults.deliveryCost ? String(defaults.deliveryCost) : '',
  )
  const [items, setItems] = useState<Item[]>(
    (defaults.items ?? []).map((i) => ({ ...i, key: newKey() })),
  )
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    defaults.paymentStatus ?? PaymentStatus.UNPAID,
  )
  const [paid, setPaid] = useState<string>(
    defaults.paid ? String(defaults.paid) : '',
  )

  const itemsTotal = orderTotal(items)
  const cost = orderCost(items)
  const delivery = deliveryMethod === DeliveryMethod.DELIVERY ? Number(deliveryCost) || 0 : 0
  const total = itemsTotal + delivery
  const balance = orderBalance(total, Number(paid) || 0)

  // При статусе оплаты «Оплачено» поле «Оплачено» = сумме сделки.
  useEffect(() => {
    if (paymentStatus === PaymentStatus.PAID) {
      setPaid(String(Math.round(total)))
    }
  }, [paymentStatus, total])

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        key: newKey(),
        productId: '',
        sku: '',
        name: '',
        unitPrice: 0,
        unitCost: 0,
        qty: 1,
        discountType: DiscountType.PERCENT,
        discountValue: 0,
      },
    ])
  }
  function removeItem(key: string) {
    setItems((prev) => prev.filter((i) => i.key !== key))
  }
  function patchItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)))
  }
  function pickProduct(key: string, productId: string) {
    const p = products.find((x) => x.id === productId)
    if (!p) {
      patchItem(key, { productId: '', sku: '', name: '', unitPrice: 0, unitCost: 0 })
      return
    }
    patchItem(key, {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      unitPrice: p.price,
      unitCost: p.cost,
    })
  }

  const itemsPayload = JSON.stringify(
    items.map(({ key, ...rest }) => rest),
  )
  const err = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="space-y-5">
      {/* Клиент */}
      <section className="space-y-3">
        <div className="flex gap-2">
          <ModeButton active={clientMode === 'existing'} onClick={() => setClientMode('existing')}>
            Существующий клиент
          </ModeButton>
          <ModeButton active={clientMode === 'new'} onClick={() => setClientMode('new')}>
            Новый
          </ModeButton>
        </div>

        {clientMode === 'existing' ? (
          <div>
            <select name="clientId" defaultValue={defaults.clientId ?? ''} className={inputClass}>
              <option value="" disabled>
                Выберите клиента
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {err.clientId?.[0] && <FieldError>{err.clientId[0]}</FieldError>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <input name="newClientName" placeholder="Имя клиента" className={inputClass} />
            <input name="newClientPhone" placeholder="Телефон" className={inputClass} />
            <input type="hidden" name="clientId" value="" />
          </div>
        )}
      </section>

      {/* Позиции */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Позиции</h2>
          <button
            type="button"
            onClick={addItem}
            className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white active:scale-[0.98]"
          >
            + Позиция
          </button>
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400 dark:border-gray-800">
            Добавьте хотя бы одну позицию
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => {
              const prod = products.find((p) => p.id === it.productId)
              const overStock = prod ? it.qty > prod.stock : false
              return (
                <div
                  key={it.key}
                  className="rounded-2xl border border-gray-200 p-3 dark:border-gray-800"
                >
                  <div className="flex items-start gap-2">
                    <select
                      value={it.productId}
                      onChange={(e) => pickProduct(it.key, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Выберите товар…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} · {p.name} ({p.stock} шт)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeItem(it.key)}
                      className="shrink-0 rounded-xl border border-gray-300 px-3 py-2.5 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      aria-label="Удалить позицию"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <NumField
                      label="Цена ₸"
                      value={it.unitPrice}
                      onChange={(v) => patchItem(it.key, { unitPrice: v })}
                    />
                    <NumField
                      label="Кол-во"
                      value={it.qty}
                      onChange={(v) => patchItem(it.key, { qty: v })}
                    />
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Скидка</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={it.discountValue || ''}
                          onChange={(e) =>
                            patchItem(it.key, { discountValue: Number(e.target.value) || 0 })
                          }
                          className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
                        />
                        <select
                          value={it.discountType}
                          onChange={(e) =>
                            patchItem(it.key, { discountType: e.target.value as DiscountType })
                          }
                          className="rounded-lg border border-gray-300 px-1 text-sm dark:border-gray-700 dark:bg-gray-900"
                        >
                          <option value="PERCENT">%</option>
                          <option value="AMOUNT">₸</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Сумма</label>
                      <div className="py-2 font-semibold">{formatMoney(lineTotal(it))}</div>
                    </div>
                  </div>
                  {overStock && (
                    <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                      На складе только {prod!.stock} шт
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {err.items?.[0] && <FieldError>{err.items[0]}</FieldError>}
        <input type="hidden" name="items" value={itemsPayload} />
      </section>

      {/* Оплата */}
      <section className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Статус оплаты</label>
          <select
            name="paymentStatus"
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
            className={inputClass}
          >
            {PAYMENT_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {paymentStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Способ оплаты</label>
          <select name="paymentMethod" defaultValue={defaults.paymentMethod ?? ''} className={inputClass}>
            <option value="">— не выбран —</option>
            {PAYMENT_METHOD_ORDER.map((m) => (
              <option key={m} value={m}>
                {paymentMethodLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Оплачено ₸</label>
          <input
            name="paid"
            inputMode="numeric"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            placeholder="0"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Статус заказа</label>
          <select name="status" defaultValue={defaults.status ?? OrderStatus.NEW} className={inputClass}>
            {ORDER_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Доставка */}
      <section className="space-y-3">
        <div>
          <label className={labelClass}>Получение</label>
          <div className="flex gap-2">
            <ModeButton active={deliveryMethod === 'PICKUP'} onClick={() => setDeliveryMethod(DeliveryMethod.PICKUP)}>
              Самовывоз
            </ModeButton>
            <ModeButton active={deliveryMethod === 'DELIVERY'} onClick={() => setDeliveryMethod(DeliveryMethod.DELIVERY)}>
              Доставка
            </ModeButton>
          </div>
          <input type="hidden" name="deliveryMethod" value={deliveryMethod} />
        </div>
        {deliveryMethod === 'DELIVERY' && (
          <div className="grid grid-cols-1 gap-2">
            <input
              name="deliveryAddress"
              defaultValue={defaults.deliveryAddress ?? ''}
              placeholder="Адрес доставки"
              className={inputClass}
            />
            <div>
              <label className={labelClass}>Стоимость доставки, ₸ (0 — бесплатно)</label>
              <input
                inputMode="numeric"
                value={deliveryCost}
                onChange={(e) => setDeliveryCost(e.target.value)}
                placeholder="0"
                className={inputClass}
              />
            </div>
            <input
              name="trackNumber"
              defaultValue={defaults.trackNumber ?? ''}
              placeholder="Трек-номер (необязательно)"
              className={inputClass}
            />
          </div>
        )}
        <input
          type="hidden"
          name="deliveryCost"
          value={deliveryMethod === DeliveryMethod.DELIVERY ? String(Number(deliveryCost) || 0) : '0'}
        />
      </section>

      <div>
        <label className={labelClass}>Заметки</label>
        <textarea name="notes" rows={2} defaultValue={defaults.notes ?? ''} className={inputClass} />
      </div>

      {/* Итоги */}
      <section className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-900">
        <Row label="Товары" value={formatMoney(itemsTotal)} />
        {delivery > 0 && <Row label="Доставка" value={formatMoney(delivery)} />}
        <Row label="Сумма к оплате" value={formatMoney(total)} strong />
        <Row label="Оплачено" value={formatMoney(Number(paid) || 0)} />
        <Row label="Остаток" value={formatMoney(balance)} highlight={balance > 0} />
        {canSeeMargin && (
          <Row
            label="Маржа по товарам"
            value={`${formatMoney(margin(itemsTotal, cost))} (${marginPercent(itemsTotal, cost)}%)`}
          />
        )}
      </section>

      {state.error && <FieldError>{state.error}</FieldError>}
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
      }`}
    >
      {children}
    </button>
  )
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-500">{label}</label>
      <input
        type="number"
        inputMode="numeric"
        value={value || ''}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
      />
    </div>
  )
}

function Row({
  label,
  value,
  strong = false,
  highlight = false,
}: {
  label: string
  value: string
  strong?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`${strong ? 'text-base font-bold' : 'font-medium'} ${
          highlight ? 'text-red-600 dark:text-red-400' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function FieldError({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{children}</p>
}
