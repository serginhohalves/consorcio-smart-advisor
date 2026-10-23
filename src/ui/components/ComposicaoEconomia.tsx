import { formatBRL, formatPercent } from '../../shared/formatters'
import type { ResultadoSimulacao } from '../simulacao'

type Sucesso = Extract<ResultadoSimulacao, { ok: true }>

/** Largura de um segmento como % da maior barra. */
const largura = (valor: number, escala: number) =>
  `${escala === 0 ? 0 : Math.max((valor / escala) * 100, valor > 0 ? 1 : 0)}%`

export function ComposicaoEconomia({ resultado }: { resultado: Sucesso }) {
  const { consorcio, financiamento, comparativo } = resultado
  const escala = Math.max(comparativo.custoConsorcio, comparativo.custoFinanciamento)

  return (
    <section className="grid gap-4 rounded-xl border border-linha bg-superficie p-5">
      <div className="grid gap-1">
        <h2 className="font-display text-lg font-semibold">Como chegamos na economia</h2>
        <p className="text-sm text-suave">
          Comparamos só o custo do crédito: o que o cliente paga além do valor do bem, usando os
          mesmos recursos próprios nas duas opções.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-medium">Consórcio: taxa adm. + fundo de reserva</span>
            <span className="font-mono text-sm tabular-nums">
              {formatBRL(comparativo.custoConsorcio)}
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-fundo" aria-hidden="true">
            <div
              className="bg-destaque"
              style={{ width: largura(comparativo.custoConsorcio, escala) }}
            />
          </div>
          <span className="text-xs text-suave">
            {formatPercent(comparativo.custoConsorcioPercentual)} da carta de{' '}
            {formatBRL(consorcio.valorCarta)}, sem juros nem IOF
          </span>
        </div>

        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-medium">Financiamento: juros + IOF</span>
            <span className="font-mono text-sm tabular-nums">
              {formatBRL(comparativo.custoFinanciamento)}
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-fundo" aria-hidden="true">
            <div
              className="bg-negativo"
              style={{ width: largura(financiamento.totalJuros, escala) }}
            />
            <div className="bg-negativo/45" style={{ width: largura(financiamento.iof, escala) }} />
          </div>
          <span className="flex flex-wrap gap-x-4 text-xs text-suave">
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-negativo" />
              Juros {formatBRL(financiamento.totalJuros)}
            </span>
            <span>
              <span className="mr-1 inline-block size-2 rounded-full bg-negativo/45" />
              IOF {formatBRL(financiamento.iof)}
            </span>
            <span>
              {formatPercent(comparativo.custoFinanciamentoPercentual)} do valor financiado de{' '}
              {formatBRL(financiamento.valorFinanciado)}
            </span>
          </span>
        </div>
      </div>

      <p className="rounded-lg bg-fundo p-3 font-mono text-sm leading-relaxed tabular-nums">
        {formatBRL(comparativo.custoFinanciamento)}{' '}
        <span className="text-suave">(financiamento)</span>
        {' − '}
        {formatBRL(comparativo.custoConsorcio)} <span className="text-suave">(consórcio)</span>
        {' = '}
        <strong className={comparativo.economia >= 0 ? 'text-positivo' : 'text-negativo'}>
          {formatBRL(comparativo.economia)}
        </strong>
      </p>
    </section>
  )
}
