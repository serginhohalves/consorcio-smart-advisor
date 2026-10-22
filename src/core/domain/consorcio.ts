import type { Cents } from './money'

/** Lance máximo aceito, como fração do valor da carta. */
export const LANCE_MAXIMO = 0.6

/** O que o lance reduz depois da contemplação. */
export type AbatimentoLance = 'prazo' | 'parcela'

export interface LanceInput {
  /** Fração do valor da carta paga com recursos próprios (0 a 0,6). */
  percentual: number
  /** Mês em que o lance é ofertado e a cota é contemplada (1 a prazo - 1). */
  mesContemplacao: number
  abatimento: AbatimentoLance
}

export interface ConsorcioInput {
  valorCarta: Cents
  prazoMeses: number
  /** Taxa de administração total do grupo, como fração (ex.: 0,15 = 15%). */
  taxaAdministracao: number
  /** Fundo de reserva total, como fração. Padrão: 0. */
  fundoReserva?: number
  lance?: LanceInput
}

export interface LanceResultado {
  valor: Cents
  mesContemplacao: number
  abatimento: AbatimentoLance
  /** Valor da parcela regular após o lance (0 se o lance quitou o saldo). */
  parcelaAposLance: Cents
  /** Número de parcelas restantes após o lance. */
  parcelasRestantes: number
}

export interface ConsorcioResultado {
  valorCarta: Cents
  /** Carta + taxa de administração + fundo de reserva. */
  totalDevido: Cents
  parcelaInicial: Cents
  /** Parcelas mensais, sem o lance. */
  parcelas: Cents[]
  lance: LanceResultado | null
  /** Soma das parcelas e do lance (igual ao total devido). */
  totalPago: Cents
  /** Custo do consórcio acima do valor da carta (taxa adm + fundo de reserva). */
  custoTotal: Cents
}
