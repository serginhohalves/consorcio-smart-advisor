import type { ConsorcioResultado } from '../domain/consorcio'
import { assertFractionInRange } from '../domain/errors'
import type { FinanciamentoResultado } from '../domain/financiamento'
import type { Cents } from '../domain/money'
import { taxaMensalEquivalente } from './simularFinanciamento'

export interface Comparativo {
  /** O que o consórcio cobra além da carta recebida (taxa adm + fundo de reserva + reajuste). */
  custoConsorcio: Cents
  /** Custo do consórcio como fração do valor da carta. */
  custoConsorcioPercentual: number
  /** Juros + IOF + TR pagos no financiamento. */
  custoFinanciamento: Cents
  /** Custo do financiamento como fração do valor liberado. */
  custoFinanciamentoPercentual: number
  /** Quanto o consórcio custa a menos, em soma nominal (negativo se o financiamento for mais barato). */
  economia: Cents
  /** Economia nominal como fração do custo do financiamento (0 se o financiamento não tiver custo). */
  economiaPercentual: number
  /** Diferença entre a primeira parcela do financiamento e a do consórcio. */
  diferencaParcelaInicial: Cents
  /** A mesma comparação trazida a valor presente. */
  valorPresente: ComparativoValorPresente
}

/**
 * Em valor presente, o custo de cada lado é o que o cliente paga (entrada, lance e
 * parcelas, cada um no seu mês) menos o bem que recebe: no financiamento, no mês 0;
 * no consórcio, a carta reajustada no mês da contemplação.
 */
export interface ComparativoValorPresente {
  /** Taxa anual usada para descontar os fluxos (ex.: rendimento da aplicação do cliente). */
  taxaDescontoAnual: number
  custoConsorcio: Cents
  custoFinanciamento: Cents
  /** Custo do financiamento menos o do consórcio, em valor presente. */
  economia: Cents
  /** Economia em valor presente como fração do valor da carta. */
  economiaPercentual: number
}

/**
 * Compara o custo de um consórcio com o de um financiamento já simulados.
 * Para uma comparação justa, o financiamento deve ser simulado sobre o valor
 * da carta menos o lance (os mesmos recursos próprios usados como entrada).
 */
export function compararSimulacoes(
  consorcio: ConsorcioResultado,
  financiamento: FinanciamentoResultado,
  taxaDescontoAnual: number,
): Comparativo {
  assertFractionInRange('taxaDescontoAnual', taxaDescontoAnual, 0, 10)

  const custoConsorcio = consorcio.custoTotal
  const custoFinanciamento = financiamento.custoTotal
  const economia = custoFinanciamento - custoConsorcio

  return {
    custoConsorcio,
    custoConsorcioPercentual: custoConsorcio / consorcio.valorCarta,
    custoFinanciamento,
    custoFinanciamentoPercentual: custoFinanciamento / financiamento.valorFinanciado,
    economia,
    economiaPercentual: custoFinanciamento === 0 ? 0 : economia / custoFinanciamento,
    diferencaParcelaInicial: financiamento.primeiraParcela - consorcio.parcelaInicial,
    valorPresente: compararEmValorPresente(consorcio, financiamento, taxaDescontoAnual),
  }
}

function compararEmValorPresente(
  consorcio: ConsorcioResultado,
  financiamento: FinanciamentoResultado,
  taxaDescontoAnual: number,
): ComparativoValorPresente {
  const taxaMensal = taxaMensalEquivalente(taxaDescontoAnual)
  const vp = (valor: number, mes: number) => valor / Math.pow(1 + taxaMensal, mes)
  const m = consorcio.mesContemplacao

  const custoConsorcio = Math.round(
    consorcio.parcelas.reduce((acc, p, i) => acc + vp(p, i + 1), 0) +
      vp((consorcio.lance?.valor ?? 0) - consorcio.cartaContemplada, m),
  )

  const entrada = consorcio.valorCarta - financiamento.valorFinanciado
  const custoFinanciamento = Math.round(
    entrada +
      financiamento.parcelas.reduce((acc, p) => acc + vp(p.valor, p.numero), 0) -
      consorcio.valorCarta,
  )

  const economia = custoFinanciamento - custoConsorcio
  return {
    taxaDescontoAnual,
    custoConsorcio,
    custoFinanciamento,
    economia,
    economiaPercentual: economia / consorcio.valorCarta,
  }
}
