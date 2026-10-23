import type { ConsorcioResultado } from '../domain/consorcio'
import type { FinanciamentoResultado } from '../domain/financiamento'
import type { Cents } from '../domain/money'

export interface Comparativo {
  /** Taxa de administração + fundo de reserva pagos no consórcio. */
  custoConsorcio: Cents
  /** Juros + IOF pagos no financiamento. */
  custoFinanciamento: Cents
  /** Quanto o consórcio custa a menos (negativo se o financiamento for mais barato). */
  economia: Cents
  /** Economia como fração do custo do financiamento (0 se o financiamento não tiver custo). */
  economiaPercentual: number
  /** Diferença entre a primeira parcela do financiamento e a do consórcio. */
  diferencaParcelaInicial: Cents
}

/**
 * Compara o custo de um consórcio com o de um financiamento já simulados.
 * Para uma comparação justa, o financiamento deve ser simulado sobre o valor
 * da carta menos o lance (os mesmos recursos próprios usados como entrada).
 */
export function compararSimulacoes(
  consorcio: ConsorcioResultado,
  financiamento: FinanciamentoResultado,
): Comparativo {
  const custoConsorcio = consorcio.custoTotal
  const custoFinanciamento = financiamento.custoTotal
  const economia = custoFinanciamento - custoConsorcio

  return {
    custoConsorcio,
    custoFinanciamento,
    economia,
    economiaPercentual: custoFinanciamento === 0 ? 0 : economia / custoFinanciamento,
    diferencaParcelaInicial: financiamento.primeiraParcela - consorcio.parcelaInicial,
  }
}
