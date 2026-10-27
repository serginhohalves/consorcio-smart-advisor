import type { FaixaPerfil } from '../core'

/** Como cada faixa do Termômetro é apresentada ao cliente. */
export const FAIXA_PERFIL: Record<FaixaPerfil, { titulo: string; texto: string; cor: string }> = {
  consorcio: {
    titulo: 'Perfil consórcio',
    texto: 'A necessidade do cliente combina com o planejamento do consórcio.',
    cor: 'text-positivo',
  },
  misto: {
    titulo: 'Perfil misto',
    texto: 'O consórcio funciona melhor com lance, para antecipar a contemplação.',
    cor: 'text-atencao',
  },
  financiamento: {
    titulo: 'Financiamento mais adequado',
    texto: 'A urgência ou o orçamento do cliente pedem o crédito imediato.',
    cor: 'text-negativo',
  },
}
