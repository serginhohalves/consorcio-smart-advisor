import {
  compararSimulacoes,
  IOF_PESSOA_FISICA,
  PARAMETROS_POR_TIPO,
  simularConsorcio,
  simularFinanciamento,
  toCents,
  ValidationError,
  type AbatimentoLance,
  type Comparativo,
  type ConsorcioResultado,
  type FinanciamentoResultado,
  type SistemaAmortizacao,
  type TipoConsorcio,
} from '../core'
import { formatDecimalBR } from '../shared/formatters'
import { parseDecimalBR } from '../shared/parsers'

/** Estado do formulário como digitado: valores em reais e percentuais (ex.: "15" = 15%). */
export interface FormularioSimulacao {
  tipo: TipoConsorcio
  valorCarta: string
  prazoMeses: string
  taxaAdministracao: string
  fundoReserva: string
  lancePercentual: string
  mesContemplacao: string
  abatimento: AbatimentoLance
  taxaJurosAnual: string
  sistema: SistemaAmortizacao
  iof: 'cobrar' | 'isento'
}

export type CampoFormulario = keyof FormularioSimulacao

/** Formulário preenchido com os valores sugeridos para o tipo de consórcio. */
export function formularioDoTipo(tipo: TipoConsorcio): FormularioSimulacao {
  const p = PARAMETROS_POR_TIPO[tipo]
  return {
    tipo,
    valorCarta: formatDecimalBR(p.valorCarta / 100),
    prazoMeses: String(p.prazoMeses),
    taxaAdministracao: formatDecimalBR(p.taxaAdministracao * 100),
    fundoReserva: formatDecimalBR(p.fundoReserva * 100),
    lancePercentual: '30',
    mesContemplacao: '12',
    abatimento: 'parcela',
    taxaJurosAnual: formatDecimalBR(p.taxaJurosAnual * 100),
    sistema: p.sistema,
    iof: p.cobraIof ? 'cobrar' : 'isento',
  }
}

export const FORMULARIO_INICIAL: FormularioSimulacao = formularioDoTipo('imovel')

export type ResultadoSimulacao =
  | {
      ok: true
      consorcio: ConsorcioResultado
      financiamento: FinanciamentoResultado
      comparativo: Comparativo
      /** Lance usado como entrada do financiamento, para comparar com os mesmos recursos. */
      entrada: number
    }
  | { ok: false; campo: CampoFormulario; mensagem: string }

const CAMPO_POR_ERRO: Record<string, CampoFormulario> = {
  valorCarta: 'valorCarta',
  prazoMeses: 'prazoMeses',
  taxaAdministracao: 'taxaAdministracao',
  fundoReserva: 'fundoReserva',
  'lance.percentual': 'lancePercentual',
  'lance.mesContemplacao': 'mesContemplacao',
  taxaJurosAnual: 'taxaJurosAnual',
}

const MENSAGENS: Record<CampoFormulario, string> = {
  tipo: 'Escolha imóvel ou veículo.',
  valorCarta: 'Informe um valor de carta maior que zero.',
  prazoMeses: 'Informe um prazo em meses (número inteiro maior que zero).',
  taxaAdministracao: 'A taxa de administração deve estar entre 0% e 100%.',
  fundoReserva: 'O fundo de reserva deve estar entre 0% e 100%.',
  lancePercentual: 'O lance deve estar entre 0% e 60% da carta.',
  mesContemplacao: 'O mês da contemplação deve ser anterior ao fim do prazo.',
  abatimento: 'Escolha se o lance reduz a parcela ou o prazo.',
  taxaJurosAnual: 'Informe uma taxa de juros válida.',
  sistema: 'Escolha Price ou SAC.',
  iof: 'Escolha se o financiamento paga IOF.',
}

/**
 * Executa a simulação a partir do formulário. O financiamento usa o mesmo prazo
 * do consórcio e o valor da carta menos o lance, que entra como entrada.
 */
export function simular(form: FormularioSimulacao): ResultadoSimulacao {
  const numero = (campo: CampoFormulario) => parseDecimalBR(form[campo])
  const percentual = (campo: CampoFormulario) => numero(campo) / 100

  try {
    const valorCarta = toCents(numero('valorCarta'))
    const prazoMeses = numero('prazoMeses')
    const lancePercentual = percentual('lancePercentual')

    const consorcio = simularConsorcio({
      valorCarta,
      prazoMeses,
      taxaAdministracao: percentual('taxaAdministracao'),
      fundoReserva: percentual('fundoReserva'),
      lance:
        lancePercentual > 0
          ? {
              percentual: lancePercentual,
              mesContemplacao: numero('mesContemplacao'),
              abatimento: form.abatimento,
            }
          : undefined,
    })

    const entrada = consorcio.lance?.valor ?? 0
    const financiamento = simularFinanciamento({
      valorFinanciado: valorCarta - entrada,
      prazoMeses,
      taxaJurosAnual: percentual('taxaJurosAnual'),
      sistema: form.sistema,
      iof: form.iof === 'cobrar' ? IOF_PESSOA_FISICA : undefined,
    })

    return {
      ok: true,
      consorcio,
      financiamento,
      comparativo: compararSimulacoes(consorcio, financiamento),
      entrada,
    }
  } catch (erro) {
    if (!(erro instanceof ValidationError)) throw erro
    const campo = CAMPO_POR_ERRO[erro.field] ?? 'valorCarta'
    const mensagem = erro.message.includes('saldo devedor')
      ? 'O lance é maior que o saldo devedor no mês da contemplação.'
      : MENSAGENS[campo]
    return { ok: false, campo, mensagem }
  }
}
