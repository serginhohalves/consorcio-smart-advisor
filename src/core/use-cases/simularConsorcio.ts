import type { ConsorcioInput, ConsorcioResultado, LanceResultado } from '../domain/consorcio'
import { LANCE_MAXIMO } from '../domain/consorcio'
import { assertFractionInRange, assertPositiveInteger, ValidationError } from '../domain/errors'
import { splitEvenly, sum } from '../domain/money'

/**
 * Simula um consórcio sem reajuste: o total devido (carta + taxa adm + fundo de reserva)
 * é dividido igualmente pelo prazo. Um lance opcional, pago com recursos próprios no mês
 * da contemplação, abate o saldo devedor reduzindo o prazo ou o valor das parcelas.
 */
export function simularConsorcio(input: ConsorcioInput): ConsorcioResultado {
  const { valorCarta, prazoMeses, taxaAdministracao, fundoReserva = 0, lance } = input

  assertPositiveInteger('valorCarta', valorCarta)
  assertPositiveInteger('prazoMeses', prazoMeses)
  assertFractionInRange('taxaAdministracao', taxaAdministracao, 0, 1)
  assertFractionInRange('fundoReserva', fundoReserva, 0, 1)

  const totalDevido = Math.round(valorCarta * (1 + taxaAdministracao + fundoReserva))
  const parcelasOriginais = splitEvenly(totalDevido, prazoMeses)
  const parcelaInicial = parcelasOriginais[0] ?? 0

  if (!lance) {
    return {
      valorCarta,
      totalDevido,
      parcelaInicial,
      parcelas: parcelasOriginais,
      lance: null,
      totalPago: totalDevido,
      custoTotal: totalDevido - valorCarta,
    }
  }

  assertFractionInRange('lance.percentual', lance.percentual, 0, LANCE_MAXIMO)
  if (
    !Number.isInteger(lance.mesContemplacao) ||
    lance.mesContemplacao < 1 ||
    lance.mesContemplacao >= prazoMeses
  ) {
    throw new ValidationError(
      'lance.mesContemplacao',
      `lance.mesContemplacao deve estar entre 1 e ${prazoMeses - 1}`,
    )
  }

  const pagasAteContemplacao = parcelasOriginais.slice(0, lance.mesContemplacao)
  const saldoDevedor = totalDevido - sum(pagasAteContemplacao)
  const valorLance = Math.round(valorCarta * lance.percentual)

  if (valorLance > saldoDevedor) {
    throw new ValidationError('lance.percentual', 'O lance não pode ser maior que o saldo devedor')
  }

  const saldoAposLance = saldoDevedor - valorLance
  const parcelasRestantes =
    lance.abatimento === 'parcela'
      ? splitEvenly(saldoAposLance, prazoMeses - lance.mesContemplacao)
      : reduzirPrazo(saldoAposLance, parcelaInicial)

  const parcelas = [...pagasAteContemplacao, ...parcelasRestantes].filter((p) => p > 0)
  const lanceResultado: LanceResultado = {
    valor: valorLance,
    mesContemplacao: lance.mesContemplacao,
    abatimento: lance.abatimento,
    parcelaAposLance: parcelasRestantes.find((p) => p > 0) ?? 0,
    parcelasRestantes: parcelasRestantes.filter((p) => p > 0).length,
  }
  const totalPago = sum(parcelas) + valorLance

  return {
    valorCarta,
    totalDevido,
    parcelaInicial,
    parcelas,
    lance: lanceResultado,
    totalPago,
    custoTotal: totalPago - valorCarta,
  }
}

/** Mantém o valor da parcela e reduz a quantidade; a última parcela leva o resíduo. */
function reduzirPrazo(saldo: number, parcela: number): number[] {
  if (saldo <= 0) return []
  const quantidade = Math.ceil(saldo / parcela)
  const parcelas = Array.from({ length: quantidade }, () => parcela)
  parcelas[quantidade - 1] = saldo - parcela * (quantidade - 1)
  return parcelas
}
