import { describe, expect, it } from 'vitest'
import { HESITACAO_INICIAL, simularHesitacao } from './hesitacao'

const premissas = { reajusteAnualBem: 0.05, rendimentoAnualAplicacao: 0.1 }

describe('simularHesitacao', () => {
  it('calcula o exemplo inicial', () => {
    const r = simularHesitacao(HESITACAO_INICIAL, 30_000_000, 9_000_000, premissas)
    expect(r).toMatchObject({ ok: true, resultado: { custoHesitacao: 600_000 } })
  })

  it('usa o reajuste das premissas da simulação', () => {
    const r = simularHesitacao(HESITACAO_INICIAL, 30_000_000, 0, {
      ...premissas,
      reajusteAnualBem: 0.045,
    })
    expect(r.ok && r.resultado.aumentoBem).toBe(1_350_000)
  })

  it.each(['0', 'x', ''])('indica a espera inválida (%s)', (mesesEspera) => {
    const r = simularHesitacao({ mesesEspera }, 30_000_000, 0, premissas)
    expect(r).toMatchObject({ ok: false, campo: 'mesesEspera' })
  })
})
