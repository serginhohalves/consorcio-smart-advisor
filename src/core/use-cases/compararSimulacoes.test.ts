import { describe, expect, it } from 'vitest'
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
    expect(c.custoFinanciamento).toBe(financiamento.totalJuros)
    expect(c.economia).toBe(financiamento.totalJuros - 1_500_000)
    expect(c.economia).toBeGreaterThan(0)
    expect(c.economiaPercentual).toBeCloseTo(c.economia / financiamento.totalJuros)
    expect(c.diferencaParcelaInicial).toBe(financiamento.primeiraParcela - 115_000)
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
