import type { ReactNode } from 'react'
import { LANCE_MAXIMO } from '../../core'
import type { CampoFormulario, FormularioSimulacao as Formulario } from '../simulacao'
import { CampoNumerico } from './CampoNumerico'
import { Segmentado } from './Segmentado'

interface FormularioSimulacaoProps {
  form: Formulario
  aoMudar: <C extends CampoFormulario>(campo: C, valor: Formulario[C]) => void
  erro?: { campo: CampoFormulario; mensagem: string }
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="font-mono text-xs tracking-widest text-suave uppercase">{titulo}</h2>
      {children}
    </section>
  )
}

export function FormularioSimulacao({ form, aoMudar, erro }: FormularioSimulacaoProps) {
  const erroDe = (campo: CampoFormulario) => (erro?.campo === campo ? erro.mensagem : undefined)
  const lanceMaximo = LANCE_MAXIMO * 100

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      noValidate
      className="grid gap-6 rounded-xl border border-linha bg-superficie p-5"
    >
      <Grupo titulo="Consórcio">
        <CampoNumerico
          id="valorCarta"
          rotulo="Valor da carta"
          prefixo="R$"
          valor={form.valorCarta}
          aoMudar={(v) => aoMudar('valorCarta', v)}
          erro={erroDe('valorCarta')}
        />
        <div className="grid grid-cols-2 gap-3">
          <CampoNumerico
            id="prazoMeses"
            rotulo="Prazo"
            sufixo="meses"
            valor={form.prazoMeses}
            aoMudar={(v) => aoMudar('prazoMeses', v)}
            erro={erroDe('prazoMeses')}
          />
          <CampoNumerico
            id="taxaAdministracao"
            rotulo="Taxa de adm."
            sufixo="%"
            valor={form.taxaAdministracao}
            aoMudar={(v) => aoMudar('taxaAdministracao', v)}
            erro={erroDe('taxaAdministracao')}
          />
        </div>
        <CampoNumerico
          id="fundoReserva"
          rotulo="Fundo de reserva"
          sufixo="%"
          dica="Taxas totais do grupo, diluídas nas parcelas. Consórcio não tem juros nem IOF."
          valor={form.fundoReserva}
          aoMudar={(v) => aoMudar('fundoReserva', v)}
          erro={erroDe('fundoReserva')}
        />
      </Grupo>

      <Grupo titulo="Lance com recursos próprios">
        <div className="grid gap-1">
          <label htmlFor="lancePercentual" className="flex justify-between text-sm font-medium">
            Percentual da carta
            <output htmlFor="lancePercentual" className="font-mono text-destaque">
              {form.lancePercentual}%
            </output>
          </label>
          <input
            id="lancePercentual"
            type="range"
            min={0}
            max={lanceMaximo}
            step={1}
            value={Number(form.lancePercentual) || 0}
            onChange={(e) => aoMudar('lancePercentual', e.target.value)}
            aria-describedby={erroDe('lancePercentual') ? 'lancePercentual-erro' : undefined}
            className="w-full accent-destaque"
          />
          {erroDe('lancePercentual') && (
            <p id="lancePercentual-erro" className="text-xs text-negativo">
              {erroDe('lancePercentual')}
            </p>
          )}
        </div>
        <CampoNumerico
          id="mesContemplacao"
          rotulo="Mês da contemplação"
          valor={form.mesContemplacao}
          aoMudar={(v) => aoMudar('mesContemplacao', v)}
          erro={erroDe('mesContemplacao')}
        />
        <Segmentado
          nome="abatimento"
          rotulo="O lance reduz"
          valor={form.abatimento}
          aoMudar={(v) => aoMudar('abatimento', v)}
          opcoes={[
            { valor: 'parcela', rotulo: 'Parcela' },
            { valor: 'prazo', rotulo: 'Prazo' },
          ]}
        />
      </Grupo>

      <Grupo titulo="Financiamento">
        <CampoNumerico
          id="taxaJurosAnual"
          rotulo="Taxa de juros"
          sufixo="% a.a."
          dica="Mesmo prazo do consórcio, com o lance como entrada."
          valor={form.taxaJurosAnual}
          aoMudar={(v) => aoMudar('taxaJurosAnual', v)}
          erro={erroDe('taxaJurosAnual')}
        />
        <Segmentado
          nome="sistema"
          rotulo="Sistema de amortização"
          valor={form.sistema}
          aoMudar={(v) => aoMudar('sistema', v)}
          opcoes={[
            { valor: 'price', rotulo: 'Price' },
            { valor: 'sac', rotulo: 'SAC' },
          ]}
        />
        <div className="grid gap-1">
          <Segmentado
            nome="iof"
            rotulo="IOF"
            valor={form.iof}
            aoMudar={(v) => aoMudar('iof', v)}
            opcoes={[
              { valor: 'cobrar', rotulo: 'Cobrar' },
              { valor: 'isento', rotulo: 'Isento' },
            ]}
          />
          <p className="text-xs text-suave">
            0,38% + 0,0082% ao dia (até 365 dias). Financiamento habitacional de pessoa física é
            isento.
          </p>
        </div>
      </Grupo>
    </form>
  )
}
