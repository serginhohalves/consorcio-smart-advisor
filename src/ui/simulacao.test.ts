import { describe, expect, it } from 'vitest'
import { FORMULARIO_INICIAL, formularioDoTipo, simular } from './simulacao'

describe('simular', () => {
  it('simula o exemplo inicial', () => {
    const r = simular(FORMULARIO_INICIAL)
    if (!r.ok) throw new Error(r.mensagem)

    expect(r.consorcio.valorCarta).toBe(30_000_000)
    expect(r.consorcio.parcelaInicial).toBe(174_000)
    expect(r.entrada).toBe(9_000_000)
    expect(r.financiamento.valorFinanciado).toBe(21_000_000)
    expect(r.financiamento.parcelas).toHaveLength(200)
    expect(r.comparativo.economia).toBeGreaterThan(0)
  })

  it('sem lance, financia a carta inteira', () => {
    const r = simular({ ...FORMULARIO_INICIAL, lancePercentual: '0' })
    if (!r.ok) throw new Error(r.mensagem)

    expect(r.consorcio.lance).toBeNull()
    expect(r.entrada).toBe(0)
    expect(r.financiamento.valorFinanciado).toBe(30_000_000)
  })

  it('preenche os valores sugeridos de cada tipo', () => {
    expect(formularioDoTipo('imovel')).toMatchObject({
      valorCarta: '300.000',
      taxaJurosAnual: '10,5',
      sistema: 'sac',
      iof: 'isento',
    })
    expect(formularioDoTipo('veiculo')).toMatchObject({
      valorCarta: '120.000',
      prazoMeses: '80',
      fundoReserva: '1,5',
      sistema: 'price',
      iof: 'cobrar',
    })
    expect(simular(formularioDoTipo('veiculo')).ok).toBe(true)
  })

  it('cobra IOF quando pedido e permite isentar', () => {
    const comIof = simular({ ...FORMULARIO_INICIAL, iof: 'cobrar' })
    const isento = simular({ ...FORMULARIO_INICIAL, iof: 'isento' })
    if (!comIof.ok || !isento.ok) throw new Error('simulação inválida')

    expect(comIof.financiamento.iof).toBeGreaterThan(0)
    expect(isento.financiamento.iof).toBe(0)
    // O IOF financiado também gera juros, então pesa mais que o próprio IOF.
    expect(comIof.comparativo.economia - isento.comparativo.economia).toBeGreaterThan(
      comIof.financiamento.iof,
    )
  })

  it('aplica a TR só para imóvel', () => {
    const imovel = simular({ ...FORMULARIO_INICIAL, trAnual: '2' })
    const veiculo = simular({ ...formularioDoTipo('veiculo'), trAnual: '2' })
    if (!imovel.ok || !veiculo.ok) throw new Error('simulação inválida')

    expect(imovel.financiamento.totalCorrecao).toBeGreaterThan(0)
    expect(veiculo.financiamento.totalCorrecao).toBe(0)
  })

  it('compara em valor presente com o rendimento informado', () => {
    const r = simular({ ...FORMULARIO_INICIAL, rendimentoAnual: '8' })
    if (!r.ok) throw new Error(r.mensagem)

    expect(r.comparativo.valorPresente.taxaDescontoAnual).toBeCloseTo(0.08)
    expect(r.consorcio.reajusteAnual).toBeCloseTo(0.05)
    expect(r.consorcio.cartaContemplada).toBe(30_000_000) // mês 12: ainda sem reajuste
  })

  it('contempla sem lance', () => {
    const r = simular({ ...FORMULARIO_INICIAL, lancePercentual: '0', mesContemplacao: '200' })
    expect(r.ok).toBe(true)
  })

  it('aceita valores no formato brasileiro', () => {
    const r = simular({ ...FORMULARIO_INICIAL, valorCarta: '150.000,50' })
    expect(r.ok && r.consorcio.valorCarta).toBe(15_000_050)
  })

  it.each([
    ['valorCarta', ''],
    ['prazoMeses', '0'],
    ['lancePercentual', '61'],
    ['mesContemplacao', '200'],
    ['taxaJurosAnual', 'abc'],
    ['reajusteAnual', '-1'],
    ['rendimentoAnual', '-1'],
    ['trAnual', '-1'],
  ] as const)('indica o campo %s inválido', (campo, valor) => {
    const r = simular({ ...FORMULARIO_INICIAL, [campo]: valor })
    expect(r).toMatchObject({ ok: false, campo })
  })

  it('explica quando o lance supera o saldo devedor', () => {
    const r = simular({ ...FORMULARIO_INICIAL, lancePercentual: '60', mesContemplacao: '150' })
    expect(r).toMatchObject({ ok: false, campo: 'lancePercentual' })
    expect(!r.ok && r.mensagem).toMatch(/saldo devedor/)
  })
})
