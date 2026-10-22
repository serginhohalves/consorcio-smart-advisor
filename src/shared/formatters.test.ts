import { describe, expect, it } from 'vitest'
import { formatBRL, formatPercent } from './formatters'

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
