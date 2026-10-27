import { FAIXAS_PERFIL, type CriterioPerfil } from '../../core'
import { FAIXA_PERFIL } from '../faixas'
import { formatPercent } from '../../shared/formatters'
import type { FormularioPerfil, ResultadoPerfil } from '../perfil'
import { CampoNumerico } from './CampoNumerico'
import { Segmentado } from './Segmentado'

interface TermometroPerfilProps {
  form: FormularioPerfil
  aoMudar: <C extends keyof FormularioPerfil>(campo: C, valor: FormularioPerfil[C]) => void
  resultado: ResultadoPerfil
}

const ROTULO_CRITERIO: Record<CriterioPerfil, string> = {
  urgencia: 'Urgência do bem',
  economia: 'Economia frente ao financiamento',
  lance: 'Recursos para lance',
  objetivo: 'Objetivo',
  renda: 'Parcela sobre a renda',
}

const pontos = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function TermometroPerfil({ form, aoMudar, resultado }: TermometroPerfilProps) {
  const r = resultado.ok ? resultado.resultado : null
  const faixa = r ? FAIXA_PERFIL[r.faixa] : null

  return (
    <section className="grid gap-4 rounded-xl border border-linha bg-superficie p-5">
      <div className="grid gap-1">
        <h2 className="font-display text-lg font-semibold">Termômetro de perfil</h2>
        <p className="text-sm text-suave">
          Três perguntas ao cliente. A economia e o lance vêm da simulação acima.
        </p>
      </div>

      <div className="grid gap-3">
        <Segmentado
          nome="urgencia"
          rotulo="Quando precisa do bem?"
          valor={form.urgencia}
          aoMudar={(v) => aoMudar('urgencia', v)}
          opcoes={[
            { valor: 'agora', rotulo: 'Agora' },
            { valor: 'ate1ano', rotulo: 'Até 1 ano' },
            { valor: 'mais1ano', rotulo: 'Mais de 1 ano' },
          ]}
        />
        <Segmentado
          nome="objetivo"
          rotulo="Objetivo da compra"
          valor={form.objetivo}
          aoMudar={(v) => aoMudar('objetivo', v)}
          opcoes={[
            { valor: 'planejamento', rotulo: 'Planejamento' },
            { valor: 'upgrade', rotulo: 'Troca' },
            { valor: 'imediata', rotulo: 'Necessidade' },
          ]}
        />
        <CampoNumerico
          id="rendaMensal"
          rotulo="Renda mensal (opcional)"
          prefixo="R$"
          dica={
            resultado.ok && resultado.comprometimentoRenda !== null
              ? `A parcela inicial compromete ${formatPercent(resultado.comprometimentoRenda)} da renda.`
              : 'Sem a renda, o peso desse critério é redistribuído.'
          }
          erro={resultado.ok ? undefined : resultado.mensagem}
          valor={form.rendaMensal}
          aoMudar={(v) => aoMudar('rendaMensal', v)}
        />
      </div>

      {r && faixa && (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className={`font-display text-xl font-semibold ${faixa.cor}`}>
                {faixa.titulo}
              </span>
              <span className="font-display text-3xl font-semibold tabular-nums">
                {r.score}
                <span className="text-base text-suave">/100</span>
              </span>
            </div>
            <div
              className="relative h-3 rounded-full"
              role="meter"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={r.score}
              aria-label="Score de aderência ao consórcio"
              style={{
                background: `linear-gradient(to right, var(--negativo) 0 ${FAIXAS_PERFIL.misto}%, var(--atencao) ${FAIXAS_PERFIL.misto}% ${FAIXAS_PERFIL.consorcio}%, var(--positivo) ${FAIXAS_PERFIL.consorcio}% 100%)`,
              }}
            >
              <span
                className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-superficie bg-texto shadow"
                style={{ left: `${r.score}%` }}
              />
            </div>
            <div className="relative h-4 font-mono text-xs text-suave" aria-hidden="true">
              {[0, FAIXAS_PERFIL.misto, FAIXAS_PERFIL.consorcio, 100].map((marca) => (
                <span
                  key={marca}
                  className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                  style={{ left: `${marca}%` }}
                >
                  {marca}
                </span>
              ))}
            </div>
            <p className="text-sm text-texto">{faixa.texto}</p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-suave">
                <th className="pb-1 font-medium">Critério</th>
                <th className="pb-1 text-right font-medium">Nota</th>
                <th className="pb-1 text-right font-medium">Pontos</th>
              </tr>
            </thead>
            <tbody className="font-mono tabular-nums">
              {r.criterios.map((c) => (
                <tr key={c.criterio} className="border-t border-dashed border-linha">
                  <td className="py-1.5 font-sans text-suave">
                    {ROTULO_CRITERIO[c.criterio]}{' '}
                    <span className="text-xs">(peso {Math.round(c.peso)})</span>
                  </td>
                  <td className="py-1.5 text-right">{Math.round(c.nota)}</td>
                  <td className="py-1.5 text-right">{pontos.format(c.contribuicao)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
