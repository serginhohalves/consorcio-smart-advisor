import { describe, expect, it } from 'vitest'
import { formatBRL, formatDecimalBR, formatPercent } from './formatters'

// Intl usa espaço não separável (U+00A0) entre "R$" e o número.
const normalize = (s: string) => s.replace(/ /g, ' ')

describe('formatBRL', () => {
  it('formata centavos como reais', () => {
    expect(normalize(formatBRL(123456))).toBe('R$ 1.234,56')
  })

  it('formata zero', () => {
    expect(normalize(formatBRL(0))).toBe('R$ 0,00')
  })
})

describe('formatPercent', () => {
  it('formata frações com duas casas', () => {
    expect(normalize(formatPercent(0.15))).toBe('15,00%')
  })
})

describe('formatDecimalBR', () => {
  it('usa separadores brasileiros e no máximo duas casas', () => {
    expect(formatDecimalBR(300000)).toBe('300.000')
    expect(formatDecimalBR(0.105 * 100)).toBe('10,5')
  })
})
