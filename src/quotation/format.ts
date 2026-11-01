const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})
export const formatMoney = (value: number) => money.format(value)
export const formatRate = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 2 }).format(value)
export const formatDate = (date: string) => date.split('-').reverse().join('/')
export const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(date),
  )
