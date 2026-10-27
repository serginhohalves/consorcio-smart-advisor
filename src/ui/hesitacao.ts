import {
  calcularCustoHesitacao,
  PARAMETROS_POR_TIPO,
  ValidationError,
  type HesitacaoResultado,
  type TipoConsorcio,
} from '../core'
import { formatDecimalBR } from '../shared/formatters'
import { parseDecimalBR } from '../shared/parsers'

/** Estado do formulário do Custo da Hesitação, como digitado (percentuais em %). */
export interface FormularioHesitacao {
  mesesEspera: string
  reajusteAnualBem: string
  rendimentoAnualAplicacao: string
}

export type CampoHesitacao = keyof FormularioHesitacao

/** Formulário com o reajuste sugerido para o tipo de bem. */
export function hesitacaoDoTipo(tipo: TipoConsorcio): FormularioHesitacao {
  return {
    mesesEspera: '12',
    reajusteAnualBem: formatDecimalBR(PARAMETROS_POR_TIPO[tipo].reajusteAnualBem * 100),
    rendimentoAnualAplicacao: '10',
  }
}

export const HESITACAO_INICIAL: FormularioHesitacao = hesitacaoDoTipo('imovel')

export type ResultadoHesitacao =
  | { ok: true; resultado: HesitacaoResultado }
  | { ok: false; campo: CampoHesitacao; mensagem: string }

const MENSAGENS: Record<CampoHesitacao, string> = {
  mesesEspera: 'Informe a espera em meses (número inteiro maior que zero).',
  reajusteAnualBem: 'Informe um reajuste anual válido.',
  rendimentoAnualAplicacao: 'Informe um rendimento anual válido.',
}

/**
 * Calcula o Custo da Hesitação para o bem da simulação, considerando como
 * recursos próprios o valor que o cliente usaria de lance.
 */
export function simularHesitacao(
  form: FormularioHesitacao,
  valorBem: number,
  recursosProprios: number,
): ResultadoHesitacao {
  try {
    const resultado = calcularCustoHesitacao({
      valorBem,
      recursosProprios,
      mesesEspera: parseDecimalBR(form.mesesEspera),
      reajusteAnualBem: parseDecimalBR(form.reajusteAnualBem) / 100,
      rendimentoAnualAplicacao: parseDecimalBR(form.rendimentoAnualAplicacao) / 100,
    })
    return { ok: true, resultado }
  } catch (erro) {
    if (!(erro instanceof ValidationError) || !(erro.field in MENSAGENS)) throw erro
    const campo = erro.field as CampoHesitacao
    return { ok: false, campo, mensagem: MENSAGENS[campo] }
  }
}
