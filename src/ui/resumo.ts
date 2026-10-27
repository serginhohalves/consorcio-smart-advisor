import { PARAMETROS_POR_TIPO, type HesitacaoResultado, type PerfilResultado } from '../core'
import { formatBRL, formatDecimalBR } from '../shared/formatters'
import { FAIXA_PERFIL } from './faixas'
import type { ResultadoSimulacao } from './simulacao'

export interface DadosResumo {
  simulacao: Extract<ResultadoSimulacao, { ok: true }>
  tipo: keyof typeof PARAMETROS_POR_TIPO
  perfil: PerfilResultado | null
  hesitacao: { resultado: HesitacaoResultado; mesesEspera: number } | null
  /** Endereço para reabrir a simulação completa. */
  link: string
}

/**
 * Resumo em texto para o cliente, no formato do WhatsApp (*negrito*, _itálico_).
 * Não inclui a renda do cliente.
 */
export function resumoWhatsApp({ simulacao, tipo, perfil, hesitacao, link }: DadosResumo): string {
  const { consorcio, financiamento, comparativo } = simulacao
  const vp = comparativo.valorPresente
  const linhas: string[] = [
    `*Consórcio x Financiamento: ${PARAMETROS_POR_TIPO[tipo].rotulo}*`,
    '',
    `Carta de crédito: ${formatBRL(consorcio.valorCarta)} em ${consorcio.parcelas.length} parcelas`,
    consorcio.lance
      ? `Lance: ${formatBRL(consorcio.lance.valor)} no mês ${consorcio.mesContemplacao}`
      : `Contemplação prevista: mês ${consorcio.mesContemplacao}`,
    '',
    '*Parcela inicial*',
    `Consórcio: ${formatBRL(consorcio.parcelaInicial)}`,
    `Financiamento: ${formatBRL(financiamento.primeiraParcela)}`,
    '',
    vp.economia >= 0
      ? `*Economia com o consórcio: ${formatBRL(vp.economia)}*`
      : `*Diferença a favor do financiamento: ${formatBRL(-vp.economia)}*`,
    `Em valor presente, descontando ${formatDecimalBR(vp.taxaDescontoAnual * 100)}% a.a.`,
  ]

  if (perfil) {
    linhas.push(
      '',
      `Termômetro de perfil: ${FAIXA_PERFIL[perfil.faixa].titulo} (${Math.round(perfil.score)}/100)`,
    )
  }
  if (hesitacao && hesitacao.resultado.custoHesitacao > 0) {
    linhas.push(
      `Esperar ${hesitacao.mesesEspera} meses para decidir custa ${formatBRL(hesitacao.resultado.custoHesitacao)}`,
    )
  }

  linhas.push(
    '',
    `Simulação completa: ${link}`,
    '',
    '_Valores estimados, sujeitos às regras do grupo e à análise de crédito._',
  )
  return linhas.join('\n')
}

/** Link que abre o WhatsApp com o texto pronto para escolher o contato. */
export function linkWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`
}
