import { useEffect, useMemo, useState } from 'react'
import { Apresentacao } from './ui/components/Apresentacao'
import { CopiarLink } from './ui/components/CopiarLink'
import { CustoHesitacao } from './ui/components/CustoHesitacao'
import { FormularioSimulacao } from './ui/components/FormularioSimulacao'
import { Resultado } from './ui/components/Resultado'
import { TermometroPerfil } from './ui/components/TermometroPerfil'
import { simularHesitacao, type CampoHesitacao, type FormularioHesitacao } from './ui/hesitacao'
import type { TipoConsorcio } from './core'
import { deQueryString, paraQueryString, type EstadoSimulacao } from './ui/link'
import { parseDecimalBR } from './shared/parsers'
import { simularPerfil, type FormularioPerfil } from './ui/perfil'
import {
  formularioDoTipo,
  simular,
  type CampoFormulario,
  type FormularioSimulacao as Formulario,
} from './ui/simulacao'

// Lido uma vez: a simulação pode chegar pronta pelo link.
const estadoInicial = deQueryString(window.location.search)

function App() {
  const [form, setForm] = useState<Formulario>(estadoInicial.simulacao)
  const resultado = useMemo(() => simular(form), [form])
  // Mantém o último resultado válido na tela enquanto o usuário corrige um campo.
  const [ultimoValido, setUltimoValido] = useState(resultado.ok ? resultado : null)
  if (resultado.ok && resultado !== ultimoValido) setUltimoValido(resultado)

  const [formHesitacao, setFormHesitacao] = useState<FormularioHesitacao>(estadoInicial.hesitacao)
  const recursosProprios = ultimoValido?.entrada ?? 0
  const premissas = useMemo(
    () =>
      ultimoValido && {
        reajusteAnualBem: ultimoValido.consorcio.reajusteAnual,
        rendimentoAnualAplicacao: ultimoValido.comparativo.valorPresente.taxaDescontoAnual,
      },
    [ultimoValido],
  )
  const resultadoHesitacao = useMemo(
    () =>
      ultimoValido && premissas
        ? simularHesitacao(
            formHesitacao,
            ultimoValido.consorcio.valorCarta,
            recursosProprios,
            premissas,
          )
        : null,
    [formHesitacao, ultimoValido, recursosProprios, premissas],
  )
  const aoMudarHesitacao = (campo: CampoHesitacao, valor: string) =>
    setFormHesitacao((atual) => ({ ...atual, [campo]: valor }))

  const [formPerfil, setFormPerfil] = useState<FormularioPerfil>(estadoInicial.perfil)
  const resultadoPerfil = useMemo(
    () => (ultimoValido ? simularPerfil(formPerfil, ultimoValido) : null),
    [formPerfil, ultimoValido],
  )
  const aoMudarPerfil = <C extends keyof FormularioPerfil>(campo: C, valor: FormularioPerfil[C]) =>
    setFormPerfil((atual) => ({ ...atual, [campo]: valor }))

  const aoMudar = <C extends CampoFormulario>(campo: C, valor: Formulario[C]) =>
    setForm((atual) => ({ ...atual, [campo]: valor }))
  const aoMudarTipo = (tipo: TipoConsorcio) => setForm(formularioDoTipo(tipo))

  const [apresentacao, setApresentacao] = useState(estadoInicial.apresentacao)
  const estado: EstadoSimulacao = useMemo(
    () => ({ simulacao: form, hesitacao: formHesitacao, perfil: formPerfil, apresentacao }),
    [form, formHesitacao, formPerfil, apresentacao],
  )
  // O cliente recebe o link já no modo apresentação e sem a própria renda.
  const linkCliente = `${window.location.origin}${window.location.pathname}?${paraQueryString(
    { ...estado, apresentacao: true },
    { semRenda: true },
  )}`

  // Mantém a URL igual à tela, para o link copiado reabrir a mesma simulação.
  useEffect(() => {
    try {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}?${paraQueryString(estado)}`,
      )
    } catch {
      // Em ambientes sem histórico (ex.: iframes restritos), o link apenas não acompanha.
    }
  }, [estado])

  const emApresentacao = apresentacao && ultimoValido !== null

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:py-10">
      <header className="grid gap-1">
        <h1 className="font-display text-3xl font-semibold text-balance">
          Consórcio Smart Advisor
        </h1>
        {!emApresentacao && (
          <p className="max-w-prose text-suave">
            Compare o custo de um consórcio com o de um financiamento usando os mesmos recursos
            próprios.
          </p>
        )}
        {!emApresentacao && (
          <div className="mt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setApresentacao(true)}
              disabled={!ultimoValido}
              className="rounded-md bg-destaque px-3 py-2 text-sm font-semibold text-superficie focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque disabled:opacity-50"
            >
              Modo apresentação
            </button>
            <CopiarLink />
          </div>
        )}
      </header>
      {emApresentacao && ultimoValido ? (
        <Apresentacao
          resultado={ultimoValido}
          tipo={form.tipo}
          perfil={resultadoPerfil}
          hesitacao={resultadoHesitacao}
          mesesEspera={parseDecimalBR(formHesitacao.mesesEspera)}
          linkCliente={linkCliente}
          aoSair={() => setApresentacao(false)}
        />
      ) : (
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
            {resultadoHesitacao && premissas && (
              <CustoHesitacao
                premissas={premissas}
                form={formHesitacao}
                aoMudar={aoMudarHesitacao}
                resultado={resultadoHesitacao}
                recursosProprios={recursosProprios}
              />
            )}
          </div>
        </div>
      )}
      {!emApresentacao && (
        <footer className="max-w-prose text-xs text-suave">
          A economia principal está em valor presente, descontada pelo rendimento da aplicação. A
          taxa de juros é efetiva anual, convertida para a mensal equivalente, e o IOF é financiado
          junto com o valor. Não consideramos seguros.
        </footer>
      )}
    </main>
  )
}

export default App
