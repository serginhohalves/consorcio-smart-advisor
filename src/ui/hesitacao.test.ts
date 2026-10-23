import { describe, expect, it } from 'vitest'
import { HESITACAO_INICIAL, simularHesitacao } from './hesitacao'

describe('simularHesitacao', () => {
  it('calcula o exemplo inicial', () => {
    const r = simularHesitacao(HESITACAO_INICIAL, 30_000_000, 9_000_000)
    expect(r).toMatchObject({ ok: true, resultado: { custoHesitacao: 600_000 } })
  })

  it('aceita percentuais com vírgula', () => {
    const r = simularHesitacao({ ...HESITACAO_INICIAL, reajusteAnualBem: '4,5' }, 30_000_000, 0)
    expect(r.ok && r.resultado.aumentoBem).toBe(1_350_000)
  })

  it.each([
    ['mesesEspera', '0'],
    ['reajusteAnualBem', 'x'],
    ['rendimentoAnualAplicacao', ''],
  ] as const)('indica o campo %s inválido', (campo, valor) => {
    const r = simularHesitacao({ ...HESITACAO_INICIAL, [campo]: valor }, 30_000_000, 0)
    expect(r).toMatchObject({ ok: false, campo })
  })
})
