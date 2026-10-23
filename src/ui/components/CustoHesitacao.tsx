import { formatBRL } from '../../shared/formatters'
import type { CampoHesitacao, FormularioHesitacao, ResultadoHesitacao } from '../hesitacao'
import { CampoNumerico } from './CampoNumerico'

interface CustoHesitacaoProps {
  form: FormularioHesitacao
  aoMudar: (campo: CampoHesitacao, valor: string) => void
  resultado: ResultadoHesitacao
  recursosProprios: number
}

export function CustoHesitacao({
  form,
  aoMudar,
  resultado,
  recursosProprios,
}: CustoHesitacaoProps) {
  const erroDe = (campo: CampoHesitacao) =>
    !resultado.ok && resultado.campo === campo ? resultado.mensagem : undefined
  const r = resultado.ok ? resultado.resultado : null
  const meses = form.mesesEspera

  return (
    <section className="grid gap-4 rounded-xl border border-linha bg-superficie p-5">
      <div className="grid gap-1">
        <h2 className="font-display text-lg font-semibold">Custo da hesitação</h2>
        <p className="text-sm text-suave">
          Quanto o cliente perde se adiar a compra: o reajuste do bem, menos o que os recursos
          próprios ({formatBRL(recursosProprios)}) renderiam aplicados durante a espera.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CampoNumerico
          id="mesesEspera"
          rotulo="Espera"
          sufixo="meses"
          valor={form.mesesEspera}
          aoMudar={(v) => aoMudar('mesesEspera', v)}
          erro={erroDe('mesesEspera')}
        />
        <CampoNumerico
          id="reajusteAnualBem"
          rotulo="Reajuste do bem"
          sufixo="% a.a."
          valor={form.reajusteAnualBem}
          aoMudar={(v) => aoMudar('reajusteAnualBem', v)}
          erro={erroDe('reajusteAnualBem')}
        />
        <CampoNumerico
          id="rendimentoAnualAplicacao"
          rotulo="Rendimento líquido"
          sufixo="% a.a."
          valor={form.rendimentoAnualAplicacao}
          aoMudar={(v) => aoMudar('rendimentoAnualAplicacao', v)}
          erro={erroDe('rendimentoAnualAplicacao')}
        />
      </div>

      {r && (
        <div className="grid gap-3">
          <p
            className={`rounded-lg p-4 ${
              r.custoHesitacao > 0
                ? 'bg-negativo-suave text-negativo'
                : 'bg-positivo-suave text-positivo'
            }`}
          >
            <span className="block text-sm font-medium">
              {r.custoHesitacao > 0
                ? `Esperar ${meses} meses custa`
                : `Esperar ${meses} meses não custa nada neste cenário`}
            </span>
            <span className="font-display text-3xl font-semibold tabular-nums">
              {formatBRL(Math.abs(r.custoHesitacao))}
            </span>
            {r.custoHesitacao > 0 && (
              <span className="block text-sm text-texto">
                Cerca de {formatBRL(r.custoPorMes)} por mês de espera.
              </span>
            )}
          </p>
          <dl className="grid gap-2">
            {[
              ['Valor do bem após a espera', formatBRL(r.valorBemFuturo)],
              ['Aumento do bem', formatBRL(r.aumentoBem)],
              ['Rendimento dos recursos próprios', formatBRL(r.rendimentoAplicacao)],
            ].map(([rotulo, valor]) => (
              <div
                key={rotulo}
                className="flex justify-between gap-3 border-b border-dashed border-linha pb-1.5"
              >
                <dt className="text-sm text-suave">{rotulo}</dt>
                <dd className="text-right font-mono text-sm tabular-nums">{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  )
}
