import { describe, expect, it } from 'vitest'
import { splitEvenly, sum, toCents } from './money'

describe('toCents', () => {
  it('converte reais em centavos arredondando', () => {
    expect(toCents(1234.56)).toBe(123456)
    expect(toCents(0.1 + 0.2)).toBe(30)
  })
})

describe('splitEvenly', () => {
  it('divide sem perder centavos', () => {
    const partes = splitEvenly(1000, 3)
    expect(partes).toEqual([334, 333, 333])
    expect(sum(partes)).toBe(1000)
  })

  it('retorna lista vazia para zero partes', () => {
    expect(splitEvenly(1000, 0)).toEqual([])
  })
})
