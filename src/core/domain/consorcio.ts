import type { Cents } from './money'

/** Lance máximo aceito, como fração do valor da carta. */
export const LANCE_MAXIMO = 0.6

/** O que o lance reduz depois da contemplação. */
export type AbatimentoLance = 'prazo' | 'parcela'

export interface LanceInput {
  /** Fração do valor da carta paga com recursos próprios (0 a 0,6). */
  percentual: number
  abatimento: AbatimentoLance
}

export interface ConsorcioInput {
  valorCarta: Cents
  prazoMeses: number
  /** Taxa de administração total do grupo, como fração (ex.: 0,15 = 15%). */
  taxaAdministracao: number
  /** Fundo de reserva total, como fração. Padrão: 0. */
  fundoReserva?: number
  /** Mês em que a cota é contemplada e o cliente recebe a carta (com lance: 1 a prazo - 1). */
  mesContemplacao: number
  /**
   * Reajuste anual da carta (INCC, IPCA...), como fração. A cada 12 meses corrige as
   * parcelas, o lance e o valor da carta recebida. Padrão: 0.
   */
  reajusteAnual?: number
  /** Lance pago com recursos próprios no mês da contemplação. */
  lance?: LanceInput
}

export interface LanceResultado {
  /** Valor do lance, já reajustado até o mês da contemplação. */
  valor: Cents
  abatimento: AbatimentoLance
  /** Valor da parcela regular logo após o lance, reajustada (0 se o lance quitou o saldo). */
  parcelaAposLance: Cents
  /** Número de parcelas restantes após o lance. */
  parcelasRestantes: number
}

export interface ConsorcioResultado {
  valorCarta: Cents
  /** Carta + taxa de administração + fundo de reserva, sem reajuste. */
  totalDevido: Cents
  parcelaInicial: Cents
  /** Parcelas mensais já reajustadas, sem o lance. A parcela i vence no mês i + 1. */
  parcelas: Cents[]
  lance: LanceResultado | null
  mesContemplacao: number
  reajusteAnual: number
  /** Valor da carta recebida na contemplação, reajustado até lá. */
  cartaContemplada: Cents
  /** Soma das parcelas e do lance. Sem reajuste, é igual ao total devido. */
  totalPago: Cents
  /**
   * O que o cliente paga além da carta que recebe. Sem reajuste, é a taxa de
   * administração mais o fundo de reserva.
   */
  custoTotal: Cents
}
