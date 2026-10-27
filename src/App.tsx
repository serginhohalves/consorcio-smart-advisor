import { useMemo, useState } from 'react'
import { CustoHesitacao } from './ui/components/CustoHesitacao'
import { FormularioSimulacao } from './ui/components/FormularioSimulacao'
import { Resultado } from './ui/components/Resultado'
import { TermometroPerfil } from './ui/components/TermometroPerfil'
import {
  HESITACAO_INICIAL,
  hesitacaoDoTipo,
  simularHesitacao,
  type CampoHesitacao,
  type FormularioHesitacao,
} from './ui/hesitacao'
import type { TipoConsorcio } from './core'
import { PERFIL_INICIAL, simularPerfil, type FormularioPerfil } from './ui/perfil'
import {
  FORMULARIO_INICIAL,
  formularioDoTipo,
  simular,
  type CampoFormulario,
  type FormularioSimulacao as Formulario,
} from './ui/simulacao'

function App() {
  const [form, setForm] = useState<Formulario>(FORMULARIO_INICIAL)
  const resultado = useMemo(() => simular(form), [form])
  // Mantém o último resultado válido na tela enquanto o usuário corrige um campo.
  const [ultimoValido, setUltimoValido] = useState(resultado.ok ? resultado : null)
  if (resultado.ok && resultado !== ultimoValido) setUltimoValido(resultado)

  const [formHesitacao, setFormHesitacao] = useState<FormularioHesitacao>(HESITACAO_INICIAL)
  const recursosProprios = ultimoValido?.entrada ?? 0
  const resultadoHesitacao = useMemo(
    () =>
      ultimoValido
        ? simularHesitacao(formHesitacao, ultimoValido.consorcio.valorCarta, recursosProprios)
        : null,
    [formHesitacao, ultimoValido, recursosProprios],
  )
  const aoMudarHesitacao = (campo: CampoHesitacao, valor: string) =>
    setFormHesitacao((atual) => ({ ...atual, [campo]: valor }))

  const [formPerfil, setFormPerfil] = useState<FormularioPerfil>(PERFIL_INICIAL)
  const resultadoPerfil = useMemo(
    () => (ultimoValido ? simularPerfil(formPerfil, ultimoValido) : null),
    [formPerfil, ultimoValido],
  )
  const aoMudarPerfil = <C extends keyof FormularioPerfil>(campo: C, valor: FormularioPerfil[C]) =>
    setFormPerfil((atual) => ({ ...atual, [campo]: valor }))

  const aoMudar = <C extends CampoFormulario>(campo: C, valor: Formulario[C]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }))
  const aoMudarTipo = (tipo: TipoConsorcio) => {
    setForm(formularioDoTipo(tipo))
    setFormHesitacao(hesitacaoDoTipo(tipo))
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:py-10">
      <header className="grid gap-1">
        <h1 className="font-display text-3xl font-semibold text-balance">
          Consórcio Smart Advisor
        </h1>
        <p className="max-w-prose text-suave">
          Compare o custo de um consórcio com o de um financiamento usando os mesmos recursos
          próprios.
        </p>
      </header>
      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <FormularioSimulacao
          form={form}
          aoMudar={aoMudar}
          aoMudarTipo={aoMudarTipo}
          erro={resultado.ok ? undefined : resultado}
        />
        <div className="grid gap-6">
          <div aria-live="polite" className={resultado.ok ? '' : 'opacity-50'}>
            {ultimoValido && <Resultado resultado={ultimoValido} />}
          </div>
          {resultadoPerfil && (
            <TermometroPerfil
              form={formPerfil}
              aoMudar={aoMudarPerfil}
              resultado={resultadoPerfil}
            />
          )}
          {resultadoHesitacao && (
            <CustoHesitacao
              tipo={form.tipo}
              form={formHesitacao}
              aoMudar={aoMudarHesitacao}
              resultado={resultadoHesitacao}
              recursosProprios={recursosProprios}
            />
          )}
        </div>
      </div>
      <footer className="max-w-prose text-xs text-suave">
        O consórcio não considera reajuste da carta (INCC/IPCA), seguros nem TR. A taxa de juros é
        efetiva anual, convertida para a mensal equivalente. O IOF é financiado junto com o valor.
      </footer>
    </main>
  )
}

export default App
