import { describe, expect, it } from 'vitest'
import { IOF_PESSOA_FISICA } from '../domain/financiamento'
import { compararSimulacoes } from './compararSimulacoes'
import { simularConsorcio } from './simularConsorcio'
import { simularFinanciamento } from './simularFinanciamento'

describe('compararSimulacoes', () => {
  const consorcio = simularConsorcio({
    valorCarta: 10_000_000,
    prazoMeses: 100,
    taxaAdministracao: 0.15,
  })

  it('calcula a economia do consórcio frente aos juros do financiamento', () => {
    const financiamento = simularFinanciamento({
      valorFinanciado: 10_000_000,
      prazoMeses: 100,
      taxaJurosAnual: 0.12,
      sistema: 'price',
    })
    const c = compararSimulacoes(consorcio, financiamento)

    expect(c.custoConsorcio).toBe(1_500_000)
    expect(c.custoConsorcioPercentual).toBeCloseTo(0.15)
    expect(c.custoFinanciamentoPercentual).toBeCloseTo(financiamento.totalJuros / 10_000_000)
    expect(c.custoFinanciamento).toBe(financiamento.totalJuros)
    expect(financiamento.iof).toBe(0)
    expect(c.economia).toBe(financiamento.totalJuros - 1_500_000)
    expect(c.economia).toBeGreaterThan(0)
    expect(c.economiaPercentual).toBeCloseTo(c.economia / financiamento.totalJuros)
    expect(c.diferencaParcelaInicial).toBe(financiamento.primeiraParcela - 115_000)
  })

  it('soma o IOF ao custo do financiamento', () => {
    const financiamento = simularFinanciamento({
      valorFinanciado: 10_000_000,
      prazoMeses: 100,
      taxaJurosAnual: 0.12,
      sistema: 'price',
      iof: IOF_PESSOA_FISICA,
    })
    const c = compararSimulacoes(consorcio, financiamento)

    expect(financiamento.iof).toBeGreaterThan(0)
    expect(c.custoFinanciamento).toBe(financiamento.totalJuros + financiamento.iof)
  })

  it('indica economia negativa quando o financiamento é mais barato', () => {
    const financiamento = simularFinanciamento({
      valorFinanciado: 10_000_000,
      prazoMeses: 100,
      taxaJurosAnual: 0,
      sistema: 'price',
    })
    const c = compararSimulacoes(consorcio, financiamento)

    expect(c.economia).toBe(-1_500_000)
    expect(c.economiaPercentual).toBe(0)
  })
})
