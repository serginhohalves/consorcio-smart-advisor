import { describe, expect, it } from 'vitest'
import { ValidationError } from '../domain/errors'
import { calcularCustoHesitacao } from './calcularCustoHesitacao'

// Bem de R$ 300.000, R$ 90.000 aplicados, 12 meses de espera.
const base = {
  valorBem: 30_000_000,
  recursosProprios: 9_000_000,
  mesesEspera: 12,
  reajusteAnualBem: 0.05,
  rendimentoAnualAplicacao: 0.1,
}

describe('calcularCustoHesitacao', () => {
  it('desconta o rendimento da aplicação do reajuste do bem', () => {
    const r = calcularCustoHesitacao(base)
    // Reajuste: 5% de R$ 300.000 = R$ 15.000. Rendimento: 10% de R$ 90.000 = R$ 9.000.
    expect(r.valorBemFuturo).toBe(31_500_000)
    expect(r.aumentoBem).toBe(1_500_000)
    expect(r.rendimentoAplicacao).toBe(900_000)
    expect(r.custoHesitacao).toBe(600_000)
    expect(r.custoPorMes).toBe(50_000)
  })

  it('compõe as taxas para prazos fracionados de ano', () => {
    const r = calcularCustoHesitacao({ ...base, mesesEspera: 6 })
    expect(r.aumentoBem).toBe(Math.round(30_000_000 * (Math.sqrt(1.05) - 1)))
    expect(r.rendimentoAplicacao).toBe(Math.round(9_000_000 * (Math.sqrt(1.1) - 1)))
  })

  it('fica negativo quando esperar compensa', () => {
    const r = calcularCustoHesitacao({ ...base, reajusteAnualBem: 0, recursosProprios: 9_000_000 })
    expect(r.aumentoBem).toBe(0)
    expect(r.custoHesitacao).toBe(-900_000)
  })

  it('sem recursos próprios, o custo é todo o reajuste', () => {
    const r = calcularCustoHesitacao({ ...base, recursosProprios: 0 })
    expect(r.custoHesitacao).toBe(1_500_000)
  })

  it.each([
    ['valorBem', { ...base, valorBem: 0 }],
    ['mesesEspera', { ...base, mesesEspera: 0 }],
    ['recursosProprios', { ...base, recursosProprios: -1 }],
    ['reajusteAnualBem', { ...base, reajusteAnualBem: Number.NaN }],
  ])('rejeita %s inválido', (field, input) => {
    expect(() => calcularCustoHesitacao(input)).toThrow(ValidationError)
    expect(() => calcularCustoHesitacao(input)).toThrow(expect.objectContaining({ field }))
  })
})
