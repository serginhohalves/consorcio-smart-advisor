import { assertFractionInRange, assertPositiveInteger, ValidationError } from '../domain/errors'
import type { HesitacaoInput, HesitacaoResultado } from '../domain/hesitacao'

/**
 * Custo de adiar a compra: o bem é reajustado durante a espera, enquanto os
 * recursos próprios do cliente rendem aplicados. Ambas as taxas são anuais,
 * compostas mensalmente pela taxa equivalente.
 */
export function calcularCustoHesitacao(input: HesitacaoInput): HesitacaoResultado {
  const { valorBem, recursosProprios, mesesEspera, reajusteAnualBem, rendimentoAnualAplicacao } =
    input

  assertPositiveInteger('valorBem', valorBem)
  assertPositiveInteger('mesesEspera', mesesEspera)
  if (!Number.isInteger(recursosProprios) || recursosProprios < 0) {
    throw new ValidationError('recursosProprios', 'recursosProprios deve ser um inteiro >= 0')
  }
  assertFractionInRange('reajusteAnualBem', reajusteAnualBem, -1, 10)
  assertFractionInRange('rendimentoAnualAplicacao', rendimentoAnualAplicacao, -1, 10)

  const anos = mesesEspera / 12
  const valorBemFuturo = Math.round(valorBem * Math.pow(1 + reajusteAnualBem, anos))
  const aumentoBem = valorBemFuturo - valorBem
  const rendimentoAplicacao = Math.round(
    recursosProprios * (Math.pow(1 + rendimentoAnualAplicacao, anos) - 1),
  )
  const custoHesitacao = aumentoBem - rendimentoAplicacao

  return {
    valorBemFuturo,
    aumentoBem,
    rendimentoAplicacao,
    custoHesitacao,
    custoPorMes: Math.round(custoHesitacao / mesesEspera),
  }
}
