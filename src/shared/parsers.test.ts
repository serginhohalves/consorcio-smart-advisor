import { describe, expect, it } from 'vitest'
import { parseDecimalBR } from './parsers'

describe('parseDecimalBR', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['1234,5', 1234.5],
    ['300.000', 300000],
    ['10.5', 10.5],
    [' 15 ', 15],
    ['0', 0],
  ])('converte %s', (texto, esperado) => {
    expect(parseDecimalBR(texto)).toBe(esperado)
  })

  it.each(['', 'abc', '1,2,3'])('retorna NaN para %j', (texto) => {
    expect(parseDecimalBR(texto)).toBeNaN()
  })
})
