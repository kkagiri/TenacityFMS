import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'
export const generateInitials = (name = '') => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}
export const toPascalCase = (value) =>
  value
    .replace(/[-_ ]+/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
export const toTitleCase = (value) => {
  if (!value) return ''
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
export function getColor(v, a = 1) {
  if (typeof window === 'undefined') return 'rgba(0,0,0,0.2)'
  const val = getComputedStyle(document.documentElement).getPropertyValue(`--color-${v}`).trim()
  if (!val) return 'rgba(0,0,0,0.2)'
  if (a === 1) return val
  if (val.startsWith('#')) {
    const c = val.replace('#', '')
    const bigint = parseInt(c, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${a})`
  }
  if (val.startsWith('rgb')) {
    const rgb = val.match(/\d+,\s*\d+,\s*\d+/)?.[0]
    return rgb ? `rgba(${rgb}, ${a})` : val
  }
  return val
}
export const getFont = () => {
  if (typeof window === 'undefined') {
    return
  }
  return getComputedStyle(document.body).fontFamily.trim()
}
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
export const splitArray = (arr, size) => {
  return Array.from(
    {
      length: Math.ceil(arr.length / size),
    },
    (_, i) => arr.slice(i * size, i * size + size)
  )
}
export const generateRandomEChartData = (dataName) => {
  const randomData = dataName.map((name) => ({
    name: name,
    value: Math.floor(Math.random() * 100) + 1,
  }))
  const total = randomData.reduce((sum, item) => sum + item.value, 0)
  randomData.forEach((item) => {
    item.value = (item.value / total) * 100
  })
  return randomData
}
export const abbreviatedNumber = (val) => {
  const s = ['', 'k', 'm', 'b', 't']
  if (val === 0) return 0
  const sNum = Math.floor(Math.log10(val) / 3)
  let sVal = parseFloat((sNum != 0 ? val / Math.pow(1000, sNum) : val).toPrecision(2))
  if (sVal % 1 != 0) {
    sVal = Number.parseInt(sVal.toFixed(1))
  }
  return sVal + s[sNum]
}
