import { describe, expect, it } from 'vitest'
import { IOF_PESSOA_FISICA } from '../domain/financiamento'
import { simularFinanciamento, taxaMensalEquivalente } from './simularFinanciamento'

// 1% a.m. equivale a (1,01^12 - 1) a.a.
const taxaAnual1PorCentoAoMes = Math.pow(1.01, 12) - 1

describe('taxaMensalEquivalente', () => {
  it('converte taxa anual em mensal composta', () => {
    expect(taxaMensalEquivalente(taxaAnual1PorCentoAoMes)).toBeCloseTo(0.01, 12)
    expect(taxaMensalEquivalente(0)).toBe(0)
  })
})

describe('simularFinanciamento Price', () => {
  const r = simularFinanciamento({
    valorFinanciado: 10_000_000,
    prazoMeses: 12,
    taxaJurosAnual: taxaAnual1PorCentoAoMes,
    sistema: 'price',
  })

  it('calcula a parcela fixa (R$ 100.000, 12x, 1% a.m. = R$ 8.884,88)', () => {
    expect(r.primeiraParcela).toBe(888_488)
    expect(r.parcelas.slice(0, -1).every((p) => p.valor === 888_488)).toBe(true)
  })

  it('quita o saldo devedor na última parcela', () => {
    expect(r.parcelas.at(-1)?.saldoDevedor).toBe(0)
    // O arredondamento mensal dos juros acumula no máximo ~1 centavo por mês.
    expect(Math.abs(r.ultimaParcela - 888_488)).toBeLessThan(12)
    expect(r.totalJuros).toBe(r.totalPago - 10_000_000)
  })
})

describe('simularFinanciamento SAC', () => {
  const r = simularFinanciamento({
    valorFinanciado: 12_000_000,
    prazoMeses: 12,
    taxaJurosAnual: taxaAnual1PorCentoAoMes,
    sistema: 'sac',
  })

  it('amortiza valor constante com parcelas decrescentes', () => {
    expect(r.parcelas.every((p) => p.amortizacao === 1_000_000)).toBe(true)
    expect(r.primeiraParcela).toBe(1_120_000)
    expect(r.ultimaParcela).toBe(1_010_000)
  })

  it('soma os juros sobre o saldo devedor (R$ 7.800,00)', () => {
    expect(r.totalJuros).toBe(780_000)
    expect(r.parcelas.at(-1)?.saldoDevedor).toBe(0)
  })
})

describe('simularFinanciamento sem juros', () => {
  it.each(['price', 'sac'] as const)('%s divide o valor pelo prazo', (sistema) => {
    const r = simularFinanciamento({
      valorFinanciado: 100_000,
      prazoMeses: 3,
      taxaJurosAnual: 0,
      sistema,
    })
    expect(r.totalJuros).toBe(0)
    expect(r.totalPago).toBe(100_000)
  })
})

describe('simularFinanciamento validações', () => {
  it('rejeita valor financiado zero', () => {
    expect(() =>
      simularFinanciamento({
        valorFinanciado: 0,
        prazoMeses: 12,
        taxaJurosAnual: 0.1,
        sistema: 'price',
      }),
    ).toThrow(expect.objectContaining({ field: 'valorFinanciado' }))
  })
})

describe('IOF', () => {
  const base = {
    prazoMeses: 12,
    taxaJurosAnual: taxaAnual1PorCentoAoMes,
    sistema: 'sac' as const,
  }

  it('é zero quando o financiamento é isento', () => {
    const r = simularFinanciamento({ ...base, valorFinanciado: 12_000_000 })
    expect(r.iof).toBe(0)
    expect(r.custoTotal).toBe(r.totalJuros)
  })

  it('soma a alíquota fixa e a diária sobre cada amortização', () => {
    // Fixa: 0,38% de R$ 120.000 = R$ 456,00.
    // Diária: R$ 10.000 por mês x 0,0082% x (30 + 60 + ... + 360 = 2.340 dias) = R$ 1.918,80.
    const r = simularFinanciamento({ ...base, valorFinanciado: 12_000_000, iof: IOF_PESSOA_FISICA })
    expect(r.iof).toBe(45_600 + 191_880)
    expect(r.custoTotal).toBe(r.totalJuros + r.iof)
  })

  it('limita a parte diária a 365 dias', () => {
    // 24 x R$ 5.000: meses 1 a 12 somam 2.340 dias; meses 13 a 24 ficam no teto (12 x 365).
    const r = simularFinanciamento({
      ...base,
      prazoMeses: 24,
      valorFinanciado: 12_000_000,
      iof: IOF_PESSOA_FISICA,
    })
    const diaria = 500_000 * 0.000082 * (2_340 + 12 * 365)
    expect(r.iof).toBe(Math.round(45_600 + diaria))
  })
})
