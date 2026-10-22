import { assertFractionInRange, assertPositiveInteger } from '../domain/errors'
import type {
  FinanciamentoInput,
  FinanciamentoResultado,
  ParcelaFinanciamento,
} from '../domain/financiamento'
import type { Cents } from '../domain/money'

/** Converte uma taxa efetiva anual em taxa efetiva mensal equivalente. */
export function taxaMensalEquivalente(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1
}

/**
 * Simula um financiamento pela Tabela Price (parcelas fixas) ou pelo SAC
 * (amortização constante). Juros arredondados ao centavo mês a mês; a última
 * parcela quita exatamente o saldo devedor.
 */
export function simularFinanciamento(input: FinanciamentoInput): FinanciamentoResultado {
  const { valorFinanciado, prazoMeses, taxaJurosAnual, sistema } = input

  assertPositiveInteger('valorFinanciado', valorFinanciado)
  assertPositiveInteger('prazoMeses', prazoMeses)
  assertFractionInRange('taxaJurosAnual', taxaJurosAnual, 0, 10)

  const taxaJurosMensal = taxaMensalEquivalente(taxaJurosAnual)
  const amortizacaoPara =
    sistema === 'price'
      ? amortizacaoPrice(valorFinanciado, prazoMeses, taxaJurosMensal)
      : amortizacaoSac(valorFinanciado, prazoMeses)

  const parcelas: ParcelaFinanciamento[] = []
  let saldo = valorFinanciado

  for (let numero = 1; numero <= prazoMeses; numero++) {
    const juros = Math.round(saldo * taxaJurosMensal)
    const amortizacao = numero === prazoMeses ? saldo : Math.min(amortizacaoPara(juros), saldo)
    saldo -= amortizacao
    parcelas.push({ numero, valor: juros + amortizacao, juros, amortizacao, saldoDevedor: saldo })
  }

  const totalPago = parcelas.reduce((acc, p) => acc + p.valor, 0)

  return {
    valorFinanciado,
    sistema,
    taxaJurosMensal,
    parcelas,
    primeiraParcela: parcelas[0]?.valor ?? 0,
    ultimaParcela: parcelas[parcelas.length - 1]?.valor ?? 0,
    totalPago,
    totalJuros: totalPago - valorFinanciado,
  }
}

/** Price: parcela fixa; a amortização é o que sobra depois dos juros. */
function amortizacaoPrice(principal: Cents, n: number, i: number): (juros: Cents) => Cents {
  const parcela =
    i === 0 ? Math.round(principal / n) : Math.round((principal * i) / (1 - Math.pow(1 + i, -n)))
  return (juros) => parcela - juros
}

/** SAC: amortização constante. */
function amortizacaoSac(principal: Cents, n: number): (juros: Cents) => Cents {
  const amortizacao = Math.round(principal / n)
  return () => amortizacao
}
