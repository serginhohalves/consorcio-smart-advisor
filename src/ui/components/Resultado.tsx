import { formatBRL, formatPercent } from '../../shared/formatters'
import type { ResultadoSimulacao } from '../simulacao'
import { CardResultado, type Linha } from './CardResultado'

type Sucesso = Extract<ResultadoSimulacao, { ok: true }>

export function Resultado({ resultado }: { resultado: Sucesso }) {
  const { consorcio, financiamento, comparativo, entrada } = resultado
  const economiza = comparativo.economia >= 0

  const linhasConsorcio: Linha[] = [
    { rotulo: 'Parcela inicial', valor: formatBRL(consorcio.parcelaInicial) },
    ...(consorcio.lance
      ? [
          { rotulo: 'Lance', valor: formatBRL(consorcio.lance.valor) },
          { rotulo: 'Parcela após o lance', valor: formatBRL(consorcio.lance.parcelaAposLance) },
          { rotulo: 'Parcelas após o lance', valor: consorcio.lance.parcelasRestantes },
        ]
      : []),
    { rotulo: 'Total de parcelas', valor: consorcio.parcelas.length },
    { rotulo: 'Total pago', valor: formatBRL(consorcio.totalPago) },
    { rotulo: 'Taxa adm. + fundo de reserva', valor: formatBRL(consorcio.custoTotal) },
  ]

  const linhasFinanciamento: Linha[] = [
    { rotulo: 'Entrada', valor: formatBRL(entrada) },
    { rotulo: 'Valor financiado', valor: formatBRL(financiamento.valorFinanciado) },
    { rotulo: 'Taxa mensal', valor: formatPercent(financiamento.taxaJurosMensal) },
    { rotulo: 'Primeira parcela', valor: formatBRL(financiamento.primeiraParcela) },
    { rotulo: 'Última parcela', valor: formatBRL(financiamento.ultimaParcela) },
    { rotulo: 'Total pago', valor: formatBRL(financiamento.totalPago) },
    { rotulo: 'Juros', valor: formatBRL(financiamento.totalJuros) },
  ]

  return (
    <div className="grid gap-4">
      <section
        className={`grid gap-1 rounded-xl p-5 ${
          economiza ? 'bg-positivo-suave text-positivo' : 'bg-negativo-suave text-negativo'
        }`}
      >
        <h2 className="text-sm font-medium">
          {economiza ? 'Economia com o consórcio' : 'Diferença a favor do financiamento'}
        </h2>
        <p className="font-display text-4xl font-semibold tabular-nums">
          {formatBRL(Math.abs(comparativo.economia))}
        </p>
        <p className="text-texto">
          {economiza
            ? `O consórcio custa ${formatPercent(comparativo.economiaPercentual)} menos que os juros do financiamento.`
            : 'Nesse cenário, os juros do financiamento ficam abaixo das taxas do consórcio.'}
        </p>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <CardResultado titulo="Consórcio" linhas={linhasConsorcio} />
        <CardResultado titulo="Financiamento" linhas={linhasFinanciamento} />
      </div>
    </div>
  )
}
