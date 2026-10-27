import type { ConsorcioInput, ConsorcioResultado, LanceResultado } from '../domain/consorcio'
import { LANCE_MAXIMO } from '../domain/consorcio'
import { assertFractionInRange, assertPositiveInteger, ValidationError } from '../domain/errors'
import { splitEvenly, sum } from '../domain/money'

/**
 * Simula um consórcio: o total devido (carta + taxa adm + fundo de reserva) é dividido
 * igualmente pelo prazo. Um lance opcional, pago com recursos próprios no mês da
 * contemplação, abate o saldo devedor reduzindo o prazo ou o valor das parcelas.
 *
 * O plano é montado em valores de hoje e depois corrigido pelo reajuste anual: a cada
 * 12 meses, parcelas, lance e carta sobem pelo índice.
 */
export function simularConsorcio(input: ConsorcioInput): ConsorcioResultado {
  const {
    valorCarta,
    prazoMeses,
    taxaAdministracao,
    fundoReserva = 0,
    mesContemplacao,
    reajusteAnual = 0,
    lance,
  } = input

  assertPositiveInteger('valorCarta', valorCarta)
  assertPositiveInteger('prazoMeses', prazoMeses)
  assertFractionInRange('taxaAdministracao', taxaAdministracao, 0, 1)
  assertFractionInRange('fundoReserva', fundoReserva, 0, 1)
  assertFractionInRange('reajusteAnual', reajusteAnual, 0, 1)

  // Com lance, sobra ao menos uma parcela para o lance abater.
  const ultimoMes = lance ? prazoMeses - 1 : prazoMeses
  if (!Number.isInteger(mesContemplacao) || mesContemplacao < 1 || mesContemplacao > ultimoMes) {
    throw new ValidationError(
      'mesContemplacao',
      `mesContemplacao deve estar entre 1 e ${ultimoMes}`,
    )
  }

  const fator = (mes: number) => fatorReajuste(reajusteAnual, mes)
  const reajustar = (parcelas: number[]) => parcelas.map((p, i) => Math.round(p * fator(i + 1)))
  const totalDevido = Math.round(valorCarta * (1 + taxaAdministracao + fundoReserva))
  const parcelasOriginais = splitEvenly(totalDevido, prazoMeses)
  const parcelaInicial = parcelasOriginais[0] ?? 0
  const comuns = {
    valorCarta,
    totalDevido,
    parcelaInicial,
    mesContemplacao,
    reajusteAnual,
    cartaContemplada: Math.round(valorCarta * fator(mesContemplacao)),
  }

  if (!lance) {
    const parcelas = reajustar(parcelasOriginais)
    const totalPago = sum(parcelas)
    return {
      ...comuns,
      parcelas,
      lance: null,
      totalPago,
      custoTotal: totalPago - comuns.cartaContemplada,
    }
  }

  assertFractionInRange('lance.percentual', lance.percentual, 0, LANCE_MAXIMO)

  const pagasAteContemplacao = parcelasOriginais.slice(0, mesContemplacao)
  const saldoDevedor = totalDevido - sum(pagasAteContemplacao)
  const lanceHoje = Math.round(valorCarta * lance.percentual)

  if (lanceHoje > saldoDevedor) {
    throw new ValidationError('lance.percentual', 'O lance não pode ser maior que o saldo devedor')
  }

  const saldoAposLance = saldoDevedor - lanceHoje
  const restantesHoje =
    lance.abatimento === 'parcela'
      ? splitEvenly(saldoAposLance, prazoMeses - mesContemplacao)
      : reduzirPrazo(saldoAposLance, parcelaInicial)

  const parcelas = reajustar([...pagasAteContemplacao, ...restantesHoje].filter((p) => p > 0))
  const parcelasRestantes = parcelas.length - mesContemplacao
  const valorLance = Math.round(lanceHoje * fator(mesContemplacao))
  const lanceResultado: LanceResultado = {
    valor: valorLance,
    abatimento: lance.abatimento,
    parcelaAposLance: parcelas[mesContemplacao] ?? 0,
    parcelasRestantes,
  }
  const totalPago = sum(parcelas) + valorLance

  return {
    ...comuns,
    parcelas,
    lance: lanceResultado,
    totalPago,
    custoTotal: totalPago - comuns.cartaContemplada,
  }
}

/** Fator acumulado do reajuste no mês (1 = primeiro mês): sobe a cada 12 meses. */
export function fatorReajuste(reajusteAnual: number, mes: number): number {
  return Math.pow(1 + reajusteAnual, Math.floor((mes - 1) / 12))
}

/** Mantém o valor da parcela e reduz a quantidade; a última parcela leva o resíduo. */
function reduzirPrazo(saldo: number, parcela: number): number[] {
  if (saldo <= 0) return []
  const quantidade = Math.ceil(saldo / parcela)
  const parcelas = Array.from({ length: quantidade }, () => parcela)
  parcelas[quantidade - 1] = saldo - parcela * (quantidade - 1)
  return parcelas
}
