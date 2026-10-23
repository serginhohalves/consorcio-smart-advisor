import { useMemo, useState } from 'react'
import { FormularioSimulacao } from './ui/components/FormularioSimulacao'
import { Resultado } from './ui/components/Resultado'
import {
  FORMULARIO_INICIAL,
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

  const aoMudar = <C extends CampoFormulario>(campo: C, valor: Formulario[C]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }))

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
          erro={resultado.ok ? undefined : resultado}
        />
        <div aria-live="polite" className={resultado.ok ? '' : 'opacity-50'}>
          {ultimoValido && <Resultado resultado={ultimoValido} />}
        </div>
      </div>
      <footer className="max-w-prose text-xs text-suave">
        Não considera reajuste da carta (INCC/IPCA), seguros nem TR. A taxa de juros é efetiva
        anual, convertida para a mensal equivalente. O IOF é considerado pago na contratação.
      </footer>
    </main>
  )
}

export default App
