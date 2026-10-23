import type { Cents } from './money'

export interface HesitacaoInput {
  /** Valor do bem hoje (normalmente o valor da carta). */
  valorBem: Cents
  /** Recursos próprios que o cliente deixaria aplicados enquanto espera (ex.: o lance). */
  recursosProprios: Cents
  /** Quantos meses o cliente adia a decisão. */
  mesesEspera: number
  /** Reajuste anual do bem, como fração (ex.: 0,05 = 5% a.a.). */
  reajusteAnualBem: number
  /** Rendimento líquido anual da aplicação, como fração. */
  rendimentoAnualAplicacao: number
}

export interface HesitacaoResultado {
  /** Valor do bem ao fim da espera. */
  valorBemFuturo: Cents
  /** Quanto o bem fica mais caro durante a espera. */
  aumentoBem: Cents
  /** Quanto os recursos próprios rendem durante a espera. */
  rendimentoAplicacao: Cents
  /** Aumento do bem menos o rendimento (negativo se esperar compensar). */
  custoHesitacao: Cents
  /** Custo da hesitação por mês de espera. */
  custoPorMes: Cents
}
