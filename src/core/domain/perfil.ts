export type Urgencia = 'agora' | 'ate1ano' | 'mais1ano'
export type Objetivo = 'planejamento' | 'upgrade' | 'imediata'
export type FaixaPerfil = 'consorcio' | 'misto' | 'financiamento'
export type CriterioPerfil = 'urgencia' | 'economia' | 'lance' | 'objetivo' | 'renda'

export interface PerfilInput {
  urgencia: Urgencia
  objetivo: Objetivo
  /** Economia do consórcio como fração do custo do financiamento. */
  economiaPercentual: number
  /** Lance como fração do valor da carta. */
  lancePercentual: number
  /** Parcela sobre a renda mensal, como fração. `null` quando a renda não foi informada. */
  comprometimentoRenda: number | null
}

export interface CriterioResultado {
  criterio: CriterioPerfil
  /** Peso efetivo, em pontos (os pesos somam 100). */
  peso: number
  /** Nota do critério, de 0 a 100. */
  nota: number
  /** Pontos que o critério soma ao score (peso x nota / 100). */
  contribuicao: number
}

export interface PerfilResultado {
  /** Score de 0 a 100. */
  score: number
  faixa: FaixaPerfil
  criterios: CriterioResultado[]
}

/** Pesos dos critérios, em pontos. Somam 100. */
export const PESOS_PERFIL: Record<CriterioPerfil, number> = {
  urgencia: 30,
  economia: 25,
  lance: 20,
  objetivo: 15,
  renda: 10,
}

/** Score mínimo de cada faixa. Abaixo de `misto`, a faixa é `financiamento`. */
export const FAIXAS_PERFIL = { consorcio: 70, misto: 40 } as const

export const NOTA_URGENCIA: Record<Urgencia, number> = { agora: 0, ate1ano: 50, mais1ano: 100 }

export const NOTA_OBJETIVO: Record<Objetivo, number> = {
  planejamento: 100,
  upgrade: 70,
  imediata: 30,
}

/** Economia a partir da qual a nota é máxima. */
export const ECONOMIA_NOTA_MAXIMA = 0.5
/** Lance a partir do qual a nota é máxima, e a nota de quem não dá lance. */
export const LANCE_NOTA_MAXIMA = 0.3
export const LANCE_NOTA_MINIMA = 20
/** Faixa de comprometimento da renda: até o mínimo vale 100, a partir do máximo vale 0. */
export const RENDA_COMPROMETIMENTO = { ideal: 0.2, limite: 0.35 } as const
