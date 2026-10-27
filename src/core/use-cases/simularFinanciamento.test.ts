import { describe, expect, it } from 'vitest'
import { IOF_PESSOA_FISICA } from '../domain/financiamento'
import { calcularIof, simularFinanciamento, taxaMensalEquivalente } from './simularFinanciamento'

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

describe('calcularIof', () => {
  // Cronograma SAC de R$ 120.000 em 12x: amortização de R$ 10.000 por mês.
  const sac12 = simularFinanciamento({
    valorFinanciado: 12_000_000,
    prazoMeses: 12,
    taxaJurosAnual: taxaAnual1PorCentoAoMes,
    sistema: 'sac',
  })

  it('soma a alíquota fixa e a diária sobre cada amortização', () => {
    // Fixa: 0,38% de R$ 120.000 = R$ 456,00.
    // Diária: R$ 10.000 x 0,0082% x (30 + 60 + ... + 360 = 2.340 dias) = R$ 1.918,80.
    expect(calcularIof(12_000_000, sac12.parcelas, IOF_PESSOA_FISICA)).toBe(45_600 + 191_880)
  })

  it('limita a parte diária a 365 dias', () => {
    // 24 x R$ 5.000: meses 1 a 12 somam 2.340 dias; meses 13 a 24 ficam no teto (12 x 365).
    const sac24 = simularFinanciamento({
      valorFinanciado: 12_000_000,
      prazoMeses: 24,
      taxaJurosAnual: 0,
      sistema: 'sac',
    })
    const diaria = 500_000 * 0.000082 * (2_340 + 12 * 365)
    expect(calcularIof(12_000_000, sac24.parcelas, IOF_PESSOA_FISICA)).toBe(
      Math.round(45_600 + diaria),
    )
  })
})

describe('simularFinanciamento com IOF financiado', () => {
  const base = {
    valorFinanciado: 12_000_000,
    prazoMeses: 12,
    taxaJurosAnual: taxaAnual1PorCentoAoMes,
    sistema: 'sac' as const,
  }

  it('não cobra IOF quando isento', () => {
    const r = simularFinanciamento(base)
    expect(r.iof).toBe(0)
    expect(r.valorTotalFinanciado).toBe(r.valorFinanciado)
    expect(r.custoTotal).toBe(r.totalJuros)
  })

  it('soma o IOF ao principal das parcelas', () => {
    const r = simularFinanciamento({ ...base, iof: IOF_PESSOA_FISICA })
    expect(r.valorTotalFinanciado).toBe(12_000_000 + r.iof)
    expect(r.parcelas.reduce((acc, p) => acc + p.amortizacao, 0)).toBe(r.valorTotalFinanciado)
  })

  it('calcula o IOF sobre o total financiado, incluindo o próprio IOF', () => {
    const r = simularFinanciamento({ ...base, iof: IOF_PESSOA_FISICA })
    // Maior que o IOF só sobre o valor liberado (R$ 2.374,80).
    expect(r.iof).toBeGreaterThan(237_480)
    expect(calcularIof(r.valorTotalFinanciado, r.parcelas, IOF_PESSOA_FISICA)).toBe(r.iof)
  })

  it('custo total = juros sobre o total financiado + IOF', () => {
    const r = simularFinanciamento({ ...base, iof: IOF_PESSOA_FISICA })
    expect(r.custoTotal).toBe(r.totalJuros + r.iof)
    expect(r.custoTotal).toBe(r.totalPago - 12_000_000)
  })
})

describe('simularFinanciamento com TR', () => {
  const entrada = {
    valorFinanciado: 10_000_000,
    prazoMeses: 120,
    taxaJurosAnual: 0.1,
  }

  it.each(['price', 'sac'] as const)(
    '%s: corrige o saldo e quita tudo na última parcela',
    (sistema) => {
      const r = simularFinanciamento({ ...entrada, sistema, trAnual: 0.02 })
      const amortizado = r.parcelas.reduce((acc, p) => acc + p.amortizacao, 0)

      expect(r.totalCorrecao).toBeGreaterThan(0)
      expect(amortizado).toBe(r.valorTotalFinanciado + r.totalCorrecao)
      expect(r.parcelas.at(-1)?.saldoDevedor).toBe(0)
      expect(r.custoTotal).toBe(r.totalJuros + r.totalCorrecao + r.iof)
    },
  )

  it('custa mais que o mesmo financiamento sem TR', () => {
    const semTr = simularFinanciamento({ ...entrada, sistema: 'price' })
    const comTr = simularFinanciamento({ ...entrada, sistema: 'price', trAnual: 0.02 })

    expect(semTr.totalCorrecao).toBe(0)
    expect(comTr.custoTotal).toBeGreaterThan(semTr.custoTotal)
    expect(comTr.ultimaParcela).toBeGreaterThan(comTr.primeiraParcela)
  })

  it('rejeita TR negativa', () => {
    expect(() => simularFinanciamento({ ...entrada, sistema: 'sac', trAnual: -0.01 })).toThrow(
      expect.objectContaining({ field: 'trAnual' }),
    )
  })
})
