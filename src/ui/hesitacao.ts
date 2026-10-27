import { calcularCustoHesitacao, ValidationError, type HesitacaoResultado } from '../core'
import { parseDecimalBR } from '../shared/parsers'

/**
 * Estado do formulário do Custo da Hesitação, como digitado. O reajuste do bem e o
 * rendimento vêm das premissas da simulação.
 */
export interface FormularioHesitacao {
  mesesEspera: string
}

export type CampoHesitacao = keyof FormularioHesitacao

export const HESITACAO_INICIAL: FormularioHesitacao = { mesesEspera: '12' }

/** Premissas da simulação usadas no cálculo, como frações. */
export interface PremissasHesitacao {
  reajusteAnualBem: number
  rendimentoAnualAplicacao: number
}

export type ResultadoHesitacao =
  | { ok: true; resultado: HesitacaoResultado }
  | { ok: false; campo: CampoHesitacao; mensagem: string }

const MENSAGENS: Record<CampoHesitacao, string> = {
  mesesEspera: 'Informe a espera em meses (número inteiro maior que zero).',
}

/**
 * Calcula o Custo da Hesitação para o bem da simulação, considerando como
 * recursos próprios o valor que o cliente usaria de lance.
 */
export function simularHesitacao(
  form: FormularioHesitacao,
  valorBem: number,
  recursosProprios: number,
  premissas: PremissasHesitacao,
): ResultadoHesitacao {
  try {
    const resultado = calcularCustoHesitacao({
      valorBem,
      recursosProprios,
      mesesEspera: parseDecimalBR(form.mesesEspera),
      ...premissas,
    })
    return { ok: true, resultado }
  } catch (erro) {
    if (!(erro instanceof ValidationError) || !(erro.field in MENSAGENS)) throw erro
    const campo = erro.field as CampoHesitacao
    return { ok: false, campo, mensagem: MENSAGENS[campo] }
  }
}
