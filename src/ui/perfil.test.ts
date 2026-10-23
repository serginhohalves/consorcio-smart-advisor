import { describe, expect, it } from 'vitest'
import { PERFIL_INICIAL, simularPerfil } from './perfil'
import { FORMULARIO_INICIAL, simular } from './simulacao'

const simulacao = simular(FORMULARIO_INICIAL)
if (!simulacao.ok) throw new Error('simulação inicial inválida')

describe('simularPerfil', () => {
  it('usa a economia e o lance da simulação', () => {
    const r = simularPerfil(PERFIL_INICIAL, simulacao)
    if (!r.ok) throw new Error(r.mensagem)

    const lance = r.resultado.criterios.find((c) => c.criterio === 'lance')
    expect(lance?.nota).toBe(100) // lance de 30% da carta
    expect(r.comprometimentoRenda).toBeNull()
    expect(r.resultado.criterios).toHaveLength(4)
  })

  it('calcula o comprometimento da renda com a parcela inicial', () => {
    const r = simularPerfil({ ...PERFIL_INICIAL, rendaMensal: '8.700' }, simulacao)
    // Parcela inicial de R$ 1.740 sobre R$ 8.700 = 20%.
    expect(r.ok && r.comprometimentoRenda).toBeCloseTo(0.2)
    expect(r.ok && r.resultado.criterios).toHaveLength(5)
  })

  it('rejeita renda inválida', () => {
    expect(simularPerfil({ ...PERFIL_INICIAL, rendaMensal: '0' }, simulacao)).toMatchObject({
      ok: false,
    })
  })
})
