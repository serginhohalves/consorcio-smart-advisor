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
    mesContemplacao: 10,
  })

  it('calcula a economia do consórcio frente aos juros do financiamento', () => {
    const financiamento = simularFinanciamento({
      valorFinanciado: 10_000_000,
      prazoMeses: 100,
      taxaJurosAnual: 0.12,
      sistema: 'price',
    })
    const c = compararSimulacoes(consorcio, financiamento, { taxaDescontoAnual: 0.1 })

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
    const c = compararSimulacoes(consorcio, financiamento, { taxaDescontoAnual: 0.1 })

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
    const c = compararSimulacoes(consorcio, financiamento, { taxaDescontoAnual: 0.1 })

    expect(c.economia).toBe(-1_500_000)
    expect(c.economiaPercentual).toBe(0)
  })

  describe('em valor presente', () => {
    const financiamento = simularFinanciamento({
      valorFinanciado: 7_000_000,
      prazoMeses: 100,
      taxaJurosAnual: 0.12,
      sistema: 'price',
    })
    const comLance = simularConsorcio({
      valorCarta: 10_000_000,
      prazoMeses: 100,
      taxaAdministracao: 0.15,
      mesContemplacao: 10,
      reajusteAnual: 0.05,
      lance: { percentual: 0.3, abatimento: 'parcela' },
    })

    it('sem desconto, coincide com a soma nominal', () => {
      const c = compararSimulacoes(comLance, financiamento, { taxaDescontoAnual: 0 })
      expect(c.valorPresente.custoConsorcio).toBe(c.custoConsorcio)
      expect(c.valorPresente.custoFinanciamento).toBe(c.custoFinanciamento)
      expect(c.valorPresente.economia).toBe(c.economia)
    })

    it('com desconto, pesa menos os pagamentos distantes', () => {
      const c = compararSimulacoes(comLance, financiamento, { taxaDescontoAnual: 0.1 })
      expect(c.valorPresente.custoFinanciamento).toBeLessThan(c.custoFinanciamento)
      expect(c.valorPresente.economia).toBeLessThan(c.economia)
      expect(c.valorPresente.economiaPercentual).toBeCloseTo(c.valorPresente.economia / 10_000_000)
    })

    it('financiamento à mesma taxa do desconto custa zero em valor presente', () => {
      const c = compararSimulacoes(comLance, financiamento, { taxaDescontoAnual: 0.12 })
      expect(Math.abs(c.valorPresente.custoFinanciamento)).toBeLessThan(100)
    })

    it('rejeita taxa de desconto negativa', () => {
      expect(() =>
        compararSimulacoes(comLance, financiamento, { taxaDescontoAnual: -0.01 }),
      ).toThrow(expect.objectContaining({ field: 'taxaDescontoAnual' }))
    })
  })

  describe('com aluguel até a contemplação', () => {
    const financiamento = simularFinanciamento({
      valorFinanciado: 10_000_000,
      prazoMeses: 100,
      taxaJurosAnual: 0.12,
      sistema: 'price',
    })

    it('soma o aluguel dos meses até a contemplação ao custo do consórcio', () => {
      const sem = compararSimulacoes(consorcio, financiamento, { taxaDescontoAnual: 0 })
      const com = compararSimulacoes(consorcio, financiamento, {
        taxaDescontoAnual: 0,
        aluguelMensal: 200_000,
      })
      // Contemplação no mês 10: 10 aluguéis de R$ 2.000,00.
      expect(com.aluguelAteContemplacao).toBe(2_000_000)
      expect(com.custoConsorcio).toBe(sem.custoConsorcio + 2_000_000)
      expect(com.economia).toBe(sem.economia - 2_000_000)
      expect(com.valorPresente.aluguelAteContemplacao).toBe(2_000_000)
    })

    it('reajusta o aluguel junto com a carta', () => {
      const comReajuste = simularConsorcio({
        valorCarta: 10_000_000,
        prazoMeses: 100,
        taxaAdministracao: 0.15,
        mesContemplacao: 13,
        reajusteAnual: 0.1,
      })
      const c = compararSimulacoes(comReajuste, financiamento, {
        taxaDescontoAnual: 0,
        aluguelMensal: 100_000,
      })
      expect(c.aluguelAteContemplacao).toBe(12 * 100_000 + 110_000)
    })

    it('rejeita aluguel negativo', () => {
      expect(() =>
        compararSimulacoes(consorcio, financiamento, {
          taxaDescontoAnual: 0.1,
          aluguelMensal: -1,
        }),
      ).toThrow(expect.objectContaining({ field: 'aluguelMensal' }))
    })
  })
})
