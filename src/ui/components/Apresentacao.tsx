import { useState } from 'react'
import { PARAMETROS_POR_TIPO, type TipoConsorcio } from '../../core'
import { formatBRL, formatDecimalBR } from '../../shared/formatters'
import { FAIXA_PERFIL } from '../faixas'
import type { ResultadoHesitacao } from '../hesitacao'
import type { ResultadoPerfil } from '../perfil'
import { linkWhatsApp, resumoWhatsApp } from '../resumo'
import type { ResultadoSimulacao } from '../simulacao'

interface ApresentacaoProps {
  resultado: Extract<ResultadoSimulacao, { ok: true }>
  tipo: TipoConsorcio
  perfil: ResultadoPerfil | null
  hesitacao: ResultadoHesitacao | null
  mesesEspera: number
  /** Link que o cliente recebe: abre neste modo e sem a renda. */
  linkCliente: string
  aoSair: () => void
}

function Coluna({ titulo, linhas }: { titulo: string; linhas: [string, string][] }) {
  return (
    <div className="grid content-start gap-3 rounded-xl border border-linha bg-superficie p-5">
      <h3 className="font-display text-xl font-semibold">{titulo}</h3>
      <dl className="grid gap-3">
        {linhas.map(([rotulo, valor]) => (
          <div key={rotulo} className="grid gap-0.5">
            <dt className="text-sm text-suave">{rotulo}</dt>
            <dd className="font-display text-2xl font-semibold tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/** Tela limpa para mostrar ao cliente, com o resumo pronto para o WhatsApp. */
export function Apresentacao({
  resultado,
  tipo,
  perfil,
  hesitacao,
  mesesEspera,
  linkCliente,
  aoSair,
}: ApresentacaoProps) {
  const { consorcio, financiamento, comparativo } = resultado
  const vp = comparativo.valorPresente
  const economiza = vp.economia >= 0
  const perfilOk = perfil?.ok ? perfil.resultado : null
  const hesitacaoOk = hesitacao?.ok ? hesitacao.resultado : null
  const [copiado, setCopiado] = useState<'parado' | 'copiado' | 'falhou'>('parado')

  const texto = resumoWhatsApp({
    simulacao: resultado,
    tipo,
    perfil: perfilOk,
    hesitacao: hesitacaoOk ? { resultado: hesitacaoOk, mesesEspera } : null,
    link: linkCliente,
  })

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado('copiado')
    } catch {
      setCopiado('falhou')
    }
    setTimeout(() => setCopiado('parado'), 2500)
  }

  const colunaConsorcio: [string, string][] = [
    ['Parcela inicial', formatBRL(consorcio.parcelaInicial)],
    ...(consorcio.lance
      ? ([
          ['Lance no mês ' + consorcio.mesContemplacao, formatBRL(consorcio.lance.valor)],
          ['Parcela após o lance', formatBRL(consorcio.lance.parcelaAposLance)],
        ] as [string, string][])
      : []),
    ['Recebe o bem', `Mês ${consorcio.mesContemplacao}`],
    ['Juros', 'Não tem'],
  ]
  const colunaFinanciamento: [string, string][] = [
    ['Primeira parcela', formatBRL(financiamento.primeiraParcela)],
    ['Entrada', formatBRL(resultado.entrada)],
    ['Recebe o bem', 'Na hora'],
    ['Juros', formatBRL(financiamento.totalJuros)],
  ]

  return (
    <div className="grid w-full gap-6">
      <p className="font-mono text-xs tracking-widest text-suave uppercase">
        {PARAMETROS_POR_TIPO[tipo].rotulo} · carta de {formatBRL(consorcio.valorCarta)} ·{' '}
        {consorcio.parcelas.length} meses
      </p>

      <section
        className={`grid gap-2 rounded-2xl p-6 sm:p-8 ${
          economiza ? 'bg-positivo-suave text-positivo' : 'bg-negativo-suave text-negativo'
        }`}
      >
        <h2 className="text-base font-medium">
          {economiza ? 'Economia com o consórcio' : 'Diferença a favor do financiamento'}
        </h2>
        <p className="font-display text-5xl font-semibold tabular-nums sm:text-6xl">
          {formatBRL(Math.abs(vp.economia))}
        </p>
        <p className="text-texto">
          Em valor presente, considerando que o dinheiro renderia{' '}
          {formatDecimalBR(vp.taxaDescontoAnual * 100)}% a.a. aplicado.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Coluna titulo="Consórcio" linhas={colunaConsorcio} />
        <Coluna titulo="Financiamento" linhas={colunaFinanciamento} />
      </div>

      {(perfilOk || (hesitacaoOk && hesitacaoOk.custoHesitacao > 0)) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {perfilOk && (
            <section className="grid content-start gap-1 rounded-xl border border-linha bg-superficie p-5">
              <h3 className="text-sm text-suave">Termômetro de perfil</h3>
              <p
                className={`font-display text-2xl font-semibold ${FAIXA_PERFIL[perfilOk.faixa].cor}`}
              >
                {FAIXA_PERFIL[perfilOk.faixa].titulo}{' '}
                <span className="tabular-nums">{Math.round(perfilOk.score)}</span>
                <span className="text-base text-suave">/100</span>
              </p>
              <p className="text-sm">{FAIXA_PERFIL[perfilOk.faixa].texto}</p>
            </section>
          )}
          {hesitacaoOk && hesitacaoOk.custoHesitacao > 0 && (
            <section className="grid content-start gap-1 rounded-xl border border-linha bg-superficie p-5">
              <h3 className="text-sm text-suave">Custo de esperar {mesesEspera} meses</h3>
              <p className="font-display text-2xl font-semibold text-negativo tabular-nums">
                {formatBRL(hesitacaoOk.custoHesitacao)}
              </p>
              <p className="text-sm">
                Cerca de {formatBRL(hesitacaoOk.custoPorMes)} por mês de indecisão.
              </p>
            </section>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <a
          href={linkWhatsApp(texto)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-positivo px-4 py-2.5 text-sm font-semibold text-superficie focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-positivo"
        >
          Enviar por WhatsApp
        </a>
        <button
          type="button"
          onClick={copiar}
          className="rounded-md border border-destaque px-4 py-2.5 text-sm font-medium text-destaque hover:bg-destaque-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
        >
          <span aria-live="polite">
            {copiado === 'copiado'
              ? 'Resumo copiado'
              : copiado === 'falhou'
                ? 'Não foi possível copiar'
                : 'Copiar resumo'}
          </span>
        </button>
        <button
          type="button"
          onClick={aoSair}
          className="rounded-md px-4 py-2.5 text-sm font-medium text-suave hover:text-texto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
        >
          Voltar a editar
        </button>
      </div>

      <p className="text-xs text-suave">
        Valores estimados, sujeitos às regras do grupo e à análise de crédito.
      </p>
    </div>
  )
}
