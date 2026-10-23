import { analisarPerfil, type Objetivo, type PerfilResultado, type Urgencia } from '../core'
import { parseDecimalBR } from '../shared/parsers'
import type { ResultadoSimulacao } from './simulacao'

export interface FormularioPerfil {
  urgencia: Urgencia
  objetivo: Objetivo
  /** Renda mensal em reais, como digitada. Vazia = não informada. */
  rendaMensal: string
}

export const PERFIL_INICIAL: FormularioPerfil = {
  urgencia: 'ate1ano',
  objetivo: 'planejamento',
  rendaMensal: '',
}

export type ResultadoPerfil =
  | { ok: true; resultado: PerfilResultado; comprometimentoRenda: number | null }
  | { ok: false; mensagem: string }

/**
 * Monta o Termômetro a partir das respostas do cliente e da simulação: a
 * economia vem do comparativo, o lance da carta e o comprometimento da renda
 * usa a parcela inicial do consórcio (a maior antes da contemplação).
 */
export function simularPerfil(
  form: FormularioPerfil,
  simulacao: Extract<ResultadoSimulacao, { ok: true }>,
): ResultadoPerfil {
  const { consorcio, comparativo, entrada } = simulacao

  let comprometimentoRenda: number | null = null
  if (form.rendaMensal.trim() !== '') {
    const renda = parseDecimalBR(form.rendaMensal)
    if (!Number.isFinite(renda) || renda <= 0) {
      return { ok: false, mensagem: 'Informe uma renda mensal maior que zero ou deixe em branco.' }
    }
    comprometimentoRenda = consorcio.parcelaInicial / 100 / renda
  }

  const resultado = analisarPerfil({
    urgencia: form.urgencia,
    objetivo: form.objetivo,
    economiaPercentual: comparativo.economiaPercentual,
    lancePercentual: entrada / consorcio.valorCarta,
    comprometimentoRenda,
  })
  return { ok: true, resultado, comprometimentoRenda }
}
