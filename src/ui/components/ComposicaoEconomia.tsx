import { formatBRL, formatDecimalBR, formatPercent } from '../../shared/formatters'
import type { ResultadoSimulacao } from '../simulacao'

type Sucesso = Extract<ResultadoSimulacao, { ok: true }>

/** Largura de um segmento como % da maior barra. */
const largura = (valor: number, escala: number) =>
  `${escala <= 0 || valor <= 0 ? 0 : Math.max((valor / escala) * 100, 1)}%`

const cor = (valor: number) => (valor >= 0 ? 'text-positivo' : 'text-negativo')

export function ComposicaoEconomia({ resultado }: { resultado: Sucesso }) {
  const { consorcio, financiamento, comparativo } = resultado
  const vp = comparativo.valorPresente
  const escala = Math.max(comparativo.custoConsorcio, comparativo.custoFinanciamento)
  const temReajuste = consorcio.reajusteAnual > 0
  const temTr = financiamento.totalCorrecao > 0
  const temAluguel = comparativo.aluguelAteContemplacao > 0

  const segmentos = [
    { rotulo: 'Juros', valor: financiamento.totalJuros, classe: 'bg-negativo' },
    { rotulo: 'IOF', valor: financiamento.iof, classe: 'bg-negativo/45' },
    ...(temTr ? [{ rotulo: 'TR', valor: financiamento.totalCorrecao, classe: 'bg-atencao' }] : []),
  ]

  const linhas = [
    ['Financiamento', comparativo.custoFinanciamento, vp.custoFinanciamento],
    ['Consórcio', comparativo.custoConsorcio, vp.custoConsorcio],
  ] as const

  return (
    <section className="grid gap-4 rounded-xl border border-linha bg-superficie p-5">
      <div className="grid gap-1">
        <h2 className="font-display text-lg font-semibold">Como chegamos na economia</h2>
        <p className="text-sm text-suave">
          O custo de cada opção é o que o cliente paga além do bem que recebe, usando os mesmos
          recursos próprios nas duas. As barras mostram a soma simples das parcelas.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-medium">
              Consórcio: taxa adm. + fundo de reserva{temReajuste && ' + reajuste'}
              {temAluguel && ' + aluguel'}
            </span>
            <span className="font-mono text-sm tabular-nums">
              {formatBRL(comparativo.custoConsorcio)}
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-fundo" aria-hidden="true">
            <div className="bg-destaque" style={{ width: largura(consorcio.custoTotal, escala) }} />
            <div
              className="bg-destaque/45"
              style={{ width: largura(comparativo.aluguelAteContemplacao, escala) }}
            />
          </div>
          <span className="flex flex-wrap gap-x-4 text-xs text-suave">
            {temAluguel && (
              <>
                <span>
                  <span className="mr-1 inline-block size-2 rounded-full bg-destaque" />
                  Taxas {formatBRL(consorcio.custoTotal)}
                </span>
                <span>
                  <span className="mr-1 inline-block size-2 rounded-full bg-destaque/45" />
                  Aluguel {formatBRL(comparativo.aluguelAteContemplacao)}
                </span>
              </>
            )}
            <span>
              {formatPercent(comparativo.custoConsorcioPercentual)} da carta de{' '}
              {formatBRL(consorcio.valorCarta)}, sem juros nem IOF
            </span>
          </span>
        </div>

        <div className="grid gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="text-sm font-medium">
              Financiamento: juros + IOF{temTr && ' + TR'}
            </span>
            <span className="font-mono text-sm tabular-nums">
              {formatBRL(comparativo.custoFinanciamento)}
            </span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-fundo" aria-hidden="true">
            {segmentos.map((s) => (
              <div
                key={s.rotulo}
                className={s.classe}
                style={{ width: largura(s.valor, escala) }}
              />
            ))}
          </div>
          <span className="flex flex-wrap gap-x-4 text-xs text-suave">
            {segmentos.map((s) => (
              <span key={s.rotulo}>
                <span className={`mr-1 inline-block size-2 rounded-full ${s.classe}`} />
                {s.rotulo} {formatBRL(s.valor)}
              </span>
            ))}
            <span>
              {formatPercent(comparativo.custoFinanciamentoPercentual)} do valor financiado de{' '}
              {formatBRL(financiamento.valorFinanciado)}
            </span>
          </span>
        </div>
      </div>

      <table className="w-full text-sm tabular-nums">
        <thead>
          <tr className="text-left text-xs text-suave">
            <th className="pb-1.5 font-normal">Custo</th>
            <th className="pb-1.5 text-right font-normal">Soma simples</th>
            <th className="pb-1.5 text-right font-normal">Valor presente</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {linhas.map(([rotulo, nominal, presente]) => (
            <tr key={rotulo} className="border-t border-dashed border-linha">
              <th className="py-1.5 text-left font-sans font-normal">{rotulo}</th>
              <td className="py-1.5 text-right">{formatBRL(nominal)}</td>
              <td className="py-1.5 text-right">{formatBRL(presente)}</td>
            </tr>
          ))}
          <tr className="border-t border-linha">
            <th className="py-1.5 text-left font-sans font-semibold">Economia</th>
            <td className={`py-1.5 text-right ${cor(comparativo.economia)}`}>
              {formatBRL(comparativo.economia)}
            </td>
            <td className={`py-1.5 text-right font-semibold ${cor(vp.economia)}`}>
              {formatBRL(vp.economia)}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="rounded-lg bg-fundo p-3 text-sm leading-relaxed text-suave">
        <strong className="font-medium text-texto">Por que valor presente?</strong> Um real pago
        daqui a dez anos pesa menos que um real hoje. Cada pagamento é descontado a{' '}
        {formatDecimalBR(vp.taxaDescontoAnual * 100)}% a.a., o rendimento da aplicação, e o bem
        conta no mês em que chega: na hora no financiamento e no mês {consorcio.mesContemplacao} no
        consórcio. Um custo negativo indica que, nesse critério, o cliente recebe mais do que paga.
      </p>
    </section>
  )
}
