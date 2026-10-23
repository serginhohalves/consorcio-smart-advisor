import { describe, expect, it } from 'vitest'
import { PESOS_PERFIL, type PerfilInput } from '../domain/perfil'
import { analisarPerfil, faixaDoScore } from './analisarPerfil'

const ideal: PerfilInput = {
  urgencia: 'mais1ano',
  objetivo: 'planejamento',
  economiaPercentual: 0.8,
  lancePercentual: 0.3,
  comprometimentoRenda: 0.15,
}

const nota = (r: ReturnType<typeof analisarPerfil>, criterio: string) =>
  r.criterios.find((c) => c.criterio === criterio)?.nota

describe('analisarPerfil', () => {
  it('os pesos somam 100', () => {
    expect(Object.values(PESOS_PERFIL).reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('perfil ideal tem score 100', () => {
    const r = analisarPerfil(ideal)
    expect(r.score).toBe(100)
    expect(r.faixa).toBe('consorcio')
  })

  it('perfil oposto fica na faixa de financiamento', () => {
    const r = analisarPerfil({
      urgencia: 'agora',
      objetivo: 'imediata',
      economiaPercentual: 0,
      lancePercentual: 0,
      comprometimentoRenda: 0.4,
    })
    // Só sobram o piso do lance (20 x 20%) e o objetivo imediato (30 x 15%).
    expect(r.score).toBe(Math.round(4 + 4.5))
    expect(r.faixa).toBe('financiamento')
  })

  it('soma as contribuições ponderadas', () => {
    const r = analisarPerfil({
      ...ideal,
      urgencia: 'ate1ano', // 50 x 30% = 15
      objetivo: 'upgrade', // 70 x 15% = 10,5
      economiaPercentual: 0.25, // 50 x 25% = 12,5
      lancePercentual: 0.15, // 60 x 20% = 12
      comprometimentoRenda: 0.275, // 50 x 10% = 5
    })
    expect(r.score).toBe(Math.round(15 + 10.5 + 12.5 + 12 + 5))
    expect(r.faixa).toBe('misto')
  })

  it('interpola o comprometimento da renda entre 20% e 35%', () => {
    expect(nota(analisarPerfil({ ...ideal, comprometimentoRenda: 0.2 }), 'renda')).toBe(100)
    expect(nota(analisarPerfil({ ...ideal, comprometimentoRenda: 0.35 }), 'renda')).toBe(0)
  })

  it('economia negativa vale nota 0', () => {
    expect(nota(analisarPerfil({ ...ideal, economiaPercentual: -0.2 }), 'economia')).toBe(0)
  })

  it('sem renda, redistribui os pesos entre os demais critérios', () => {
    const r = analisarPerfil({ ...ideal, comprometimentoRenda: null })
    expect(r.criterios.map((c) => c.criterio)).not.toContain('renda')
    expect(r.criterios.reduce((acc, c) => acc + c.peso, 0)).toBeCloseTo(100)
    expect(r.score).toBe(100)
  })
})

describe('faixaDoScore', () => {
  it.each([
    [100, 'consorcio'],
    [70, 'consorcio'],
    [69, 'misto'],
    [40, 'misto'],
    [39, 'financiamento'],
    [0, 'financiamento'],
  ] as const)('%i -> %s', (score, faixa) => {
    expect(faixaDoScore(score)).toBe(faixa)
  })
})
