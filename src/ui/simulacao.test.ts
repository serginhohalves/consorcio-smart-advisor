import { describe, expect, it } from 'vitest'
import { FORMULARIO_INICIAL, simular } from './simulacao'

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

  it('cobra IOF por padrão e permite isentar', () => {
    const comIof = simular(FORMULARIO_INICIAL)
    const isento = simular({ ...FORMULARIO_INICIAL, iof: 'isento' })
    if (!comIof.ok || !isento.ok) throw new Error('simulação inválida')

    expect(comIof.financiamento.iof).toBeGreaterThan(0)
    expect(isento.financiamento.iof).toBe(0)
    expect(comIof.comparativo.economia - isento.comparativo.economia).toBe(comIof.financiamento.iof)
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
