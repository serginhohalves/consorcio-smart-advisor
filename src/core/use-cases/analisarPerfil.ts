import { assertFractionInRange } from '../domain/errors'
import type {
  CriterioPerfil,
  CriterioResultado,
  FaixaPerfil,
  PerfilInput,
  PerfilResultado,
} from '../domain/perfil'
import {
  ECONOMIA_NOTA_MAXIMA,
  FAIXAS_PERFIL,
  LANCE_NOTA_MAXIMA,
  LANCE_NOTA_MINIMA,
  NOTA_OBJETIVO,
  NOTA_URGENCIA,
  PESOS_PERFIL,
  RENDA_COMPROMETIMENTO,
} from '../domain/perfil'

/** Posição de `x` entre `inicio` e `fim`, limitada a [0, 1]. */
function proporcao(x: number, inicio: number, fim: number): number {
  return Math.min(Math.max((x - inicio) / (fim - inicio), 0), 1)
}

/**
 * Termômetro de Perfil: score ponderado de 0 a 100 que indica o quanto o
 * consórcio se adequa à necessidade do cliente. Sem a renda informada, o
 * critério de renda sai do cálculo e os demais pesos são redistribuídos.
 */
export function analisarPerfil(input: PerfilInput): PerfilResultado {
  const { urgencia, objetivo, economiaPercentual, lancePercentual, comprometimentoRenda } = input

  assertFractionInRange('lancePercentual', lancePercentual, 0, 1)
  if (comprometimentoRenda !== null) {
    assertFractionInRange('comprometimentoRenda', comprometimentoRenda, 0, Number.MAX_VALUE)
  }

  const notas: Partial<Record<CriterioPerfil, number>> = {
    urgencia: NOTA_URGENCIA[urgencia],
    economia: 100 * proporcao(economiaPercentual, 0, ECONOMIA_NOTA_MAXIMA),
    lance:
      LANCE_NOTA_MINIMA +
      (100 - LANCE_NOTA_MINIMA) * proporcao(lancePercentual, 0, LANCE_NOTA_MAXIMA),
    objetivo: NOTA_OBJETIVO[objetivo],
  }
  if (comprometimentoRenda !== null) {
    notas.renda =
      100 *
      (1 -
        proporcao(comprometimentoRenda, RENDA_COMPROMETIMENTO.ideal, RENDA_COMPROMETIMENTO.limite))
  }

  const ativos = (Object.keys(PESOS_PERFIL) as CriterioPerfil[]).filter((c) => c in notas)
  const pesoTotal = ativos.reduce((acc, c) => acc + PESOS_PERFIL[c], 0)

  const criterios: CriterioResultado[] = ativos.map((criterio) => {
    const peso = (PESOS_PERFIL[criterio] / pesoTotal) * 100
    const nota = notas[criterio] ?? 0
    return { criterio, peso, nota, contribuicao: (peso * nota) / 100 }
  })

  const score = Math.round(criterios.reduce((acc, c) => acc + c.contribuicao, 0))
  return { score, faixa: faixaDoScore(score), criterios }
}

export function faixaDoScore(score: number): FaixaPerfil {
  if (score >= FAIXAS_PERFIL.consorcio) return 'consorcio'
  if (score >= FAIXAS_PERFIL.misto) return 'misto'
  return 'financiamento'
}
