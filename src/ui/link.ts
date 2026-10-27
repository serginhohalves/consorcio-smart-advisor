import type { FormularioHesitacao } from './hesitacao'
import type { FormularioPerfil } from './perfil'
import { formularioDoTipo, type FormularioSimulacao } from './simulacao'
import { HESITACAO_INICIAL } from './hesitacao'
import { PERFIL_INICIAL } from './perfil'

/** Tudo o que o gerente preencheu, para reabrir a mesma simulação a partir de um link. */
export interface EstadoSimulacao {
  simulacao: FormularioSimulacao
  hesitacao: FormularioHesitacao
  perfil: FormularioPerfil
}

type Campo<T> = { [K in keyof T]: { chave: string; opcoes?: readonly T[K][] } }

// Chaves curtas e estáveis: mudar uma delas quebra links já enviados.
const CAMPOS_SIMULACAO: Omit<Campo<FormularioSimulacao>, 'tipo'> = {
  valorCarta: { chave: 'carta' },
  prazoMeses: { chave: 'prazo' },
  taxaAdministracao: { chave: 'adm' },
  fundoReserva: { chave: 'fr' },
  lancePercentual: { chave: 'lance' },
  mesContemplacao: { chave: 'mes' },
  abatimento: { chave: 'abat', opcoes: ['parcela', 'prazo'] },
  taxaJurosAnual: { chave: 'juros' },
  trAnual: { chave: 'tr' },
  sistema: { chave: 'sist', opcoes: ['price', 'sac'] },
  iof: { chave: 'iof', opcoes: ['cobrar', 'isento'] },
  reajusteAnual: { chave: 'reaj' },
  rendimentoAnual: { chave: 'rend' },
}

const CAMPOS_HESITACAO: Campo<FormularioHesitacao> = {
  mesesEspera: { chave: 'espera' },
}

const CAMPOS_PERFIL: Campo<FormularioPerfil> = {
  urgencia: { chave: 'urg', opcoes: ['agora', 'ate1ano', 'mais1ano'] },
  objetivo: { chave: 'obj', opcoes: ['planejamento', 'upgrade', 'imediata'] },
  rendaMensal: { chave: 'renda' },
}

const TIPOS = ['imovel', 'veiculo'] as const

/**
 * Gera a query string da simulação. Só entram os valores diferentes dos sugeridos
 * para o tipo, para o link ficar curto.
 */
export function paraQueryString(estado: EstadoSimulacao): string {
  const params = new URLSearchParams({ tipo: estado.simulacao.tipo })
  escrever(params, CAMPOS_SIMULACAO, estado.simulacao, formularioDoTipo(estado.simulacao.tipo))
  escrever(params, CAMPOS_HESITACAO, estado.hesitacao, HESITACAO_INICIAL)
  escrever(params, CAMPOS_PERFIL, estado.perfil, PERFIL_INICIAL)
  return params.toString()
}

/**
 * Lê a simulação de uma query string. O que faltar ou for inválido volta ao valor
 * sugerido; números fora da faixa ficam como vieram e aparecem como erro no formulário.
 */
export function deQueryString(query: string): EstadoSimulacao {
  const params = new URLSearchParams(query)
  const tipoInformado = params.get('tipo')
  const tipo = TIPOS.find((t) => t === tipoInformado) ?? 'imovel'

  return {
    simulacao: {
      ...ler(params, CAMPOS_SIMULACAO, formularioDoTipo(tipo)),
      tipo,
    },
    hesitacao: ler(params, CAMPOS_HESITACAO, HESITACAO_INICIAL),
    perfil: ler(params, CAMPOS_PERFIL, PERFIL_INICIAL),
  }
}

function escrever<T extends object>(
  params: URLSearchParams,
  campos: Partial<Campo<T>>,
  valores: T,
  padrao: T,
): void {
  for (const [nome, campo] of entradas(campos)) {
    if (valores[nome] !== padrao[nome]) params.set(campo.chave, String(valores[nome]))
  }
}

function ler<T extends object>(params: URLSearchParams, campos: Partial<Campo<T>>, padrao: T): T {
  const resultado = { ...padrao }
  for (const [nome, campo] of entradas(campos)) {
    const valor = params.get(campo.chave)
    if (valor === null) continue
    if (campo.opcoes && !campo.opcoes.some((opcao) => opcao === valor)) continue
    resultado[nome] = valor as T[keyof T]
  }
  return resultado
}

function entradas<T>(campos: Partial<Campo<T>>) {
  return Object.entries(campos) as [keyof T, { chave: string; opcoes?: readonly unknown[] }][]
}
