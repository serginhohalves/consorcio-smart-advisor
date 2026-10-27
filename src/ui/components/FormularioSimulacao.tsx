import type { ReactNode } from 'react'
import { LANCE_MAXIMO, PARAMETROS_POR_TIPO, type TipoConsorcio } from '../../core'
import type { CampoFormulario, FormularioSimulacao as Formulario } from '../simulacao'
import { CampoNumerico } from './CampoNumerico'
import { Segmentado } from './Segmentado'

interface FormularioSimulacaoProps {
  form: Formulario
  aoMudar: <C extends CampoFormulario>(campo: C, valor: Formulario[C]) => void
  /** Troca o tipo e recarrega os valores sugeridos. */
  aoMudarTipo: (tipo: TipoConsorcio) => void
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

const TIPOS = (Object.keys(PARAMETROS_POR_TIPO) as TipoConsorcio[]).map((tipo) => ({
  valor: tipo,
  rotulo: PARAMETROS_POR_TIPO[tipo].rotulo,
}))

const DICA_IOF: Record<TipoConsorcio, string> = {
  imovel: 'Financiamento habitacional de pessoa física é isento de IOF.',
  veiculo: 'Pessoa física paga 0,38% + 0,0082% ao dia (até 365 dias), financiado junto.',
}

const ROTULO_ALUGUEL: Record<TipoConsorcio, string> = {
  imovel: 'Aluguel mensal até a contemplação',
  veiculo: 'Transporte mensal até a contemplação',
}

const INDICE_REAJUSTE: Record<TipoConsorcio, string> = {
  imovel: 'Imóveis costumam seguir o INCC.',
  veiculo: 'Veículos novos costumam seguir o IPCA.',
}

export function FormularioSimulacao({
  form,
  aoMudar,
  aoMudarTipo,
  erro,
}: FormularioSimulacaoProps) {
  const erroDe = (campo: CampoFormulario) => (erro?.campo === campo ? erro.mensagem : undefined)
  const lanceMaximo = LANCE_MAXIMO * 100

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      noValidate
      className="grid gap-6 rounded-xl border border-linha bg-superficie p-5"
    >
      <Grupo titulo="Tipo de bem">
        <div className="grid gap-1">
          <Segmentado
            nome="tipo"
            rotulo="O que o cliente quer comprar?"
            valor={form.tipo}
            aoMudar={aoMudarTipo}
            opcoes={TIPOS}
          />
          <p className="text-xs text-suave">Trocar o tipo recarrega os valores sugeridos.</p>
        </div>
      </Grupo>

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
        <CampoNumerico
          id="mesContemplacao"
          rotulo="Mês da contemplação"
          dica="Quando o cliente recebe a carta, com ou sem lance."
          valor={form.mesContemplacao}
          aoMudar={(v) => aoMudar('mesContemplacao', v)}
          erro={erroDe('mesContemplacao')}
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
        {form.tipo === 'imovel' && (
          <CampoNumerico
            id="trAnual"
            rotulo="TR estimada"
            sufixo="% a.a."
            dica="Opcional. Corrige o saldo devedor todo mês, como no SFH."
            valor={form.trAnual}
            aoMudar={(v) => aoMudar('trAnual', v)}
            erro={erroDe('trAnual')}
          />
        )}
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
          <p className="text-xs text-suave">{DICA_IOF[form.tipo]}</p>
        </div>
      </Grupo>

      <Grupo titulo="Premissas">
        <CampoNumerico
          id="reajusteAnual"
          rotulo="Reajuste anual do bem"
          sufixo="% a.a."
          dica={`Corrige a carta e as parcelas do consórcio a cada 12 meses. ${INDICE_REAJUSTE[form.tipo]}`}
          valor={form.reajusteAnual}
          aoMudar={(v) => aoMudar('reajusteAnual', v)}
          erro={erroDe('reajusteAnual')}
        />
        <CampoNumerico
          id="rendimentoAnual"
          rotulo="Rendimento líquido da aplicação"
          sufixo="% a.a."
          dica="Quanto o dinheiro do cliente renderia aplicado. Usado para trazer os valores a valor presente."
          valor={form.rendimentoAnual}
          aoMudar={(v) => aoMudar('rendimentoAnual', v)}
          erro={erroDe('rendimentoAnual')}
        />
        <CampoNumerico
          id="aluguelMensal"
          rotulo={ROTULO_ALUGUEL[form.tipo]}
          prefixo="R$"
          dica="Opcional. O que o cliente gasta por ainda não ter o bem, reajustado como a carta. No financiamento o bem chega na hora."
          valor={form.aluguelMensal}
          aoMudar={(v) => aoMudar('aluguelMensal', v)}
          erro={erroDe('aluguelMensal')}
        />
      </Grupo>
    </form>
  )
}
