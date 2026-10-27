import { assertFractionInRange, assertPositiveInteger } from '../domain/errors'
import { IOF_DIAS_MAXIMO } from '../domain/financiamento'
import type {
  AliquotasIof,
  FinanciamentoInput,
  FinanciamentoResultado,
  ParcelaFinanciamento,
  SistemaAmortizacao,
} from '../domain/financiamento'
import type { Cents } from '../domain/money'

/** Converte uma taxa efetiva anual em taxa efetiva mensal equivalente. */
export function taxaMensalEquivalente(taxaAnual: number): number {
  return Math.pow(1 + taxaAnual, 1 / 12) - 1
}

/**
 * Simula um financiamento pela Tabela Price (parcelas fixas) ou pelo SAC
 * (amortização constante). Juros arredondados ao centavo mês a mês; a última
 * parcela quita exatamente o saldo devedor. Quando há IOF, ele é financiado:
 * somado ao valor liberado, com o cálculo refeito até o IOF estabilizar.
 */
export function simularFinanciamento(input: FinanciamentoInput): FinanciamentoResultado {
  const {
    valorFinanciado,
    prazoMeses,
    taxaJurosAnual,
    sistema,
    iof: aliquotasIof,
    trAnual = 0,
  } = input

  assertPositiveInteger('valorFinanciado', valorFinanciado)
  assertPositiveInteger('prazoMeses', prazoMeses)
  assertFractionInRange('taxaJurosAnual', taxaJurosAnual, 0, 10)
  assertFractionInRange('trAnual', trAnual, 0, 1)

  const taxaJurosMensal = taxaMensalEquivalente(taxaJurosAnual)
  const trMensal = taxaMensalEquivalente(trAnual)
  const gerar = (principal: Cents) =>
    gerarParcelas(principal, prazoMeses, taxaJurosMensal, trMensal, sistema)

  let iof = 0
  let parcelas = gerar(valorFinanciado)

  if (aliquotasIof) {
    // O IOF incide sobre o total financiado, que inclui o próprio IOF: ponto fixo.
    for (let i = 0; i < MAX_ITERACOES_IOF; i++) {
      const proximo = calcularIof(valorFinanciado + iof, parcelas, aliquotasIof)
      if (proximo === iof) break
      iof = proximo
      parcelas = gerar(valorFinanciado + iof)
    }
  }

  const valorTotalFinanciado = valorFinanciado + iof
  const totalPago = parcelas.reduce((acc, p) => acc + p.valor, 0)
  const totalJuros = parcelas.reduce((acc, p) => acc + p.juros, 0)
  const totalCorrecao = parcelas.reduce((acc, p) => acc + p.correcao, 0)

  return {
    valorFinanciado,
    valorTotalFinanciado,
    sistema,
    taxaJurosMensal,
    parcelas,
    primeiraParcela: parcelas[0]?.valor ?? 0,
    ultimaParcela: parcelas[parcelas.length - 1]?.valor ?? 0,
    totalPago,
    totalJuros,
    totalCorrecao,
    iof,
    custoTotal: totalPago - valorFinanciado,
  }
}

/** O IOF converge em poucas iterações; o limite só protege contra oscilação de arredondamento. */
const MAX_ITERACOES_IOF = 20

function gerarParcelas(
  principal: Cents,
  prazoMeses: number,
  taxaJurosMensal: number,
  trMensal: number,
  sistema: SistemaAmortizacao,
): ParcelaFinanciamento[] {
  const parcelas: ParcelaFinanciamento[] = []
  let saldo = principal
  // Sem TR a parcela (Price) ou a amortização (SAC) é calculada uma vez; com TR, é
  // recalculada todo mês sobre o saldo corrigido e os meses que faltam.
  let amortizacaoPara = amortizacaoDoSistema(sistema, principal, prazoMeses, taxaJurosMensal)

  for (let numero = 1; numero <= prazoMeses; numero++) {
    const correcao = Math.round(saldo * trMensal)
    saldo += correcao
    if (trMensal > 0) {
      const restantes = prazoMeses - numero + 1
      amortizacaoPara = amortizacaoDoSistema(sistema, saldo, restantes, taxaJurosMensal)
    }
    const juros = Math.round(saldo * taxaJurosMensal)
    const amortizacao = numero === prazoMeses ? saldo : Math.min(amortizacaoPara(juros), saldo)
    saldo -= amortizacao
    parcelas.push({
      numero,
      valor: juros + amortizacao,
      juros,
      amortizacao,
      correcao,
      saldoDevedor: saldo,
    })
  }

  return parcelas
}

function amortizacaoDoSistema(
  sistema: SistemaAmortizacao,
  principal: Cents,
  n: number,
  i: number,
): (juros: Cents) => Cents {
  return sistema === 'price' ? amortizacaoPrice(principal, n, i) : amortizacaoSac(principal, n)
}

/**
 * IOF de crédito: alíquota fixa sobre o valor financiado mais a alíquota diária sobre
 * cada amortização, pelos dias até o vencimento (meses de 30 dias, teto de 365 dias).
 */
export function calcularIof(
  valorFinanciado: Cents,
  parcelas: readonly ParcelaFinanciamento[],
  aliquotas: AliquotasIof,
): Cents {
  assertFractionInRange('iof.fixa', aliquotas.fixa, 0, 1)
  assertFractionInRange('iof.diaria', aliquotas.diaria, 0, 1)

  const diario = parcelas.reduce((acc, p) => {
    const dias = Math.min(p.numero * 30, IOF_DIAS_MAXIMO)
    return acc + p.amortizacao * aliquotas.diaria * dias
  }, 0)
  return Math.round(valorFinanciado * aliquotas.fixa + diario)
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
