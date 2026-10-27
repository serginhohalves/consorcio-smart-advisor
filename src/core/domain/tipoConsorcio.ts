import type { SistemaAmortizacao } from './financiamento'
import type { Cents } from './money'

export type TipoConsorcio = 'imovel' | 'veiculo'

/** Valores sugeridos para começar a simulação de cada tipo. Todos são editáveis. */
export interface ParametrosTipo {
  rotulo: string
  valorCarta: Cents
  prazoMeses: number
  /** Taxa de administração do prazo todo, como fração. */
  taxaAdministracao: number
  fundoReserva: number
  /** Juros efetivos anuais do financiamento equivalente, como fração. */
  taxaJurosAnual: number
  sistema: SistemaAmortizacao
  /** Financiamento habitacional de pessoa física é isento de IOF. */
  cobraIof: boolean
  /** Reajuste anual esperado do preço do bem, como fração. */
  reajusteAnualBem: number
}

export const PARAMETROS_POR_TIPO: Record<TipoConsorcio, ParametrosTipo> = {
  imovel: {
    rotulo: 'Imóvel',
    valorCarta: 30_000_000,
    prazoMeses: 200,
    taxaAdministracao: 0.15,
    fundoReserva: 0.01,
    taxaJurosAnual: 0.105,
    sistema: 'sac',
    cobraIof: false,
    reajusteAnualBem: 0.05,
  },
  veiculo: {
    rotulo: 'Veículo',
    valorCarta: 12_000_000,
    prazoMeses: 80,
    taxaAdministracao: 0.12,
    fundoReserva: 0.015,
    taxaJurosAnual: 0.21,
    sistema: 'price',
    cobraIof: true,
    reajusteAnualBem: 0.04,
  },
}
