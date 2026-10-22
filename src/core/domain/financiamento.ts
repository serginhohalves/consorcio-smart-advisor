import type { Cents } from './money'

export type SistemaAmortizacao = 'price' | 'sac'

export interface FinanciamentoInput {
  valorFinanciado: Cents
  prazoMeses: number
  /** Taxa de juros efetiva anual, como fração (ex.: 0,12 = 12% a.a.). */
  taxaJurosAnual: number
  sistema: SistemaAmortizacao
}

export interface ParcelaFinanciamento {
  numero: number
  valor: Cents
  juros: Cents
  amortizacao: Cents
  /** Saldo devedor após o pagamento desta parcela. */
  saldoDevedor: Cents
}

export interface FinanciamentoResultado {
  valorFinanciado: Cents
  sistema: SistemaAmortizacao
  taxaJurosMensal: number
  parcelas: ParcelaFinanciamento[]
  primeiraParcela: Cents
  ultimaParcela: Cents
  totalPago: Cents
  totalJuros: Cents
}
