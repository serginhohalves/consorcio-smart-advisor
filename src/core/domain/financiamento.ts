import type { Cents } from './money'

export type SistemaAmortizacao = 'price' | 'sac'

export interface FinanciamentoInput {
  valorFinanciado: Cents
  prazoMeses: number
  /** Taxa de juros efetiva anual, como fração (ex.: 0,12 = 12% a.a.). */
  taxaJurosAnual: number
  sistema: SistemaAmortizacao
  /** Alíquotas de IOF. Omitido = isento (ex.: financiamento habitacional de pessoa física). */
  iof?: AliquotasIof
}

export interface AliquotasIof {
  /** Alíquota adicional, cobrada uma vez sobre o valor financiado. */
  fixa: number
  /** Alíquota por dia, sobre cada amortização, contada até o vencimento da parcela. */
  diaria: number
}

/** IOF de operações de crédito para pessoa física. */
export const IOF_PESSOA_FISICA: AliquotasIof = { fixa: 0.0038, diaria: 0.000082 }

/** Teto de dias para a parcela diária do IOF. */
export const IOF_DIAS_MAXIMO = 365

export interface ParcelaFinanciamento {
  numero: number
  valor: Cents
  juros: Cents
  amortizacao: Cents
  /** Saldo devedor após o pagamento desta parcela. */
  saldoDevedor: Cents
}

export interface FinanciamentoResultado {
  /** Valor liberado ao cliente. */
  valorFinanciado: Cents
  /** Valor liberado + IOF financiado: base das parcelas. */
  valorTotalFinanciado: Cents
  sistema: SistemaAmortizacao
  taxaJurosMensal: number
  parcelas: ParcelaFinanciamento[]
  primeiraParcela: Cents
  ultimaParcela: Cents
  totalPago: Cents
  totalJuros: Cents
  /** IOF financiado junto com o valor (0 se isento). */
  iof: Cents
  /** Custo do crédito acima do valor liberado: juros + IOF. */
  custoTotal: Cents
}
