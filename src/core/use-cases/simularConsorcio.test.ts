import { describe, expect, it } from 'vitest'
import { ValidationError } from '../domain/errors'
import { sum } from '../domain/money'
import { simularConsorcio } from './simularConsorcio'

// Carta de R$ 100.000,00, 100 meses, 15% de taxa de administração, contemplada no mês 10.
const base = {
  valorCarta: 10_000_000,
  prazoMeses: 100,
  taxaAdministracao: 0.15,
  mesContemplacao: 10,
}

describe('simularConsorcio sem lance', () => {
  it('divide carta + taxa adm igualmente pelo prazo', () => {
    const r = simularConsorcio(base)
    expect(r.totalDevido).toBe(11_500_000)
    expect(r.parcelaInicial).toBe(115_000)
    expect(r.parcelas).toHaveLength(100)
    expect(r.totalPago).toBe(11_500_000)
    expect(r.custoTotal).toBe(1_500_000)
    expect(r.lance).toBeNull()
  })

  it('inclui o fundo de reserva no total devido', () => {
    const r = simularConsorcio({ ...base, fundoReserva: 0.01 })
    expect(r.totalDevido).toBe(11_600_000)
    expect(r.custoTotal).toBe(1_600_000)
  })
})

describe('simularConsorcio com reajuste', () => {
  const comReajuste = { ...base, prazoMeses: 24, reajusteAnual: 0.1 }

  it('corrige as parcelas a cada 12 meses', () => {
    const r = simularConsorcio(comReajuste)
    // R$ 115.000,00 em 24 parcelas de R$ 4.791,67; do mês 13 em diante, +10%.
    expect(r.parcelas[0]).toBe(479_167)
    expect(r.parcelas[11]).toBe(479_167)
    expect(r.parcelas[12]).toBe(527_084)
    expect(r.totalDevido).toBe(11_500_000)
    expect(r.totalPago).toBeGreaterThan(r.totalDevido)
  })

  it('corrige a carta recebida e o lance até a contemplação', () => {
    const r = simularConsorcio({
      ...comReajuste,
      mesContemplacao: 13,
      lance: { percentual: 0.3, abatimento: 'parcela' },
    })
    expect(r.cartaContemplada).toBe(11_000_000)
    expect(r.lance?.valor).toBe(3_300_000)
    expect(r.custoTotal).toBe(r.totalPago - r.cartaContemplada)
  })

  it('sem reajuste, a carta recebida é a contratada', () => {
    const r = simularConsorcio(base)
    expect(r.cartaContemplada).toBe(r.valorCarta)
  })

  it('aceita contemplação no último mês sem lance', () => {
    expect(simularConsorcio({ ...base, mesContemplacao: 100 }).mesContemplacao).toBe(100)
  })
})

describe('simularConsorcio com lance', () => {
  // Após 10 parcelas de R$ 1.150,00, o saldo é R$ 103.500,00; o lance de 30% (R$ 30.000,00)
  // deixa R$ 73.500,00.
  const lance = { percentual: 0.3 }

  it('abatimento na parcela mantém o prazo e reduz o valor', () => {
    const r = simularConsorcio({ ...base, lance: { ...lance, abatimento: 'parcela' } })
    expect(r.lance?.valor).toBe(3_000_000)
    expect(r.lance?.parcelasRestantes).toBe(90)
    expect(r.lance?.parcelaAposLance).toBe(81_667)
    expect(r.parcelas).toHaveLength(100)
    expect(sum(r.parcelas.slice(10))).toBe(7_350_000)
    expect(r.totalPago).toBe(r.totalDevido)
  })

  it('abatimento no prazo mantém a parcela e reduz a quantidade', () => {
    const r = simularConsorcio({ ...base, lance: { ...lance, abatimento: 'prazo' } })
    expect(r.lance?.parcelaAposLance).toBe(115_000)
    expect(r.lance?.parcelasRestantes).toBe(64)
    expect(r.parcelas).toHaveLength(74)
    expect(r.parcelas.at(-1)).toBe(105_000)
    expect(r.totalPago).toBe(r.totalDevido)
  })

  it('aceita lance de exatamente 60%', () => {
    const r = simularConsorcio({
      ...base,
      mesContemplacao: 1,
      lance: { percentual: 0.6, abatimento: 'prazo' },
    })
    expect(r.lance?.valor).toBe(6_000_000)
  })

  it('rejeita lance acima de 60%', () => {
    expect(() =>
      simularConsorcio({
        ...base,
        mesContemplacao: 1,
        lance: { percentual: 0.61, abatimento: 'prazo' },
      }),
    ).toThrow(ValidationError)
  })

  it('rejeita lance maior que o saldo devedor', () => {
    expect(() =>
      simularConsorcio({
        ...base,
        mesContemplacao: 60,
        lance: { percentual: 0.6, abatimento: 'prazo' },
      }),
    ).toThrow(/saldo devedor/)
  })

  it('rejeita mês de contemplação fora do prazo', () => {
    expect(() =>
      simularConsorcio({ ...base, mesContemplacao: 100, lance: { ...lance, abatimento: 'prazo' } }),
    ).toThrow(ValidationError)
  })
})

describe('simularConsorcio validações', () => {
  it.each([
    ['valorCarta', { ...base, valorCarta: 0 }],
    ['prazoMeses', { ...base, prazoMeses: 0 }],
    ['taxaAdministracao', { ...base, taxaAdministracao: -0.1 }],
    ['reajusteAnual', { ...base, reajusteAnual: -0.01 }],
    ['mesContemplacao', { ...base, mesContemplacao: 101 }],
    ['mesContemplacao', { ...base, mesContemplacao: 0 }],
  ])('rejeita %s inválido', (field, input) => {
    expect(() => simularConsorcio(input)).toThrow(expect.objectContaining({ field }))
  })
})
