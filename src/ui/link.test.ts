import { describe, expect, it } from 'vitest'
import { HESITACAO_INICIAL } from './hesitacao'
import { deQueryString, paraQueryString, type EstadoSimulacao } from './link'
import { PERFIL_INICIAL } from './perfil'
import { formularioDoTipo } from './simulacao'

const inicial: EstadoSimulacao = {
  simulacao: formularioDoTipo('imovel'),
  hesitacao: HESITACAO_INICIAL,
  perfil: PERFIL_INICIAL,
  apresentacao: false,
}

describe('link da simulação', () => {
  it('com os valores sugeridos, guarda só o tipo', () => {
    expect(paraQueryString(inicial)).toBe('tipo=imovel')
  })

  it('ida e volta preserva tudo o que foi preenchido', () => {
    const estado: EstadoSimulacao = {
      simulacao: {
        ...formularioDoTipo('veiculo'),
        valorCarta: '95.500,50',
        lancePercentual: '45',
        abatimento: 'prazo',
        iof: 'isento',
        rendimentoAnual: '11,5',
        aluguelMensal: '2.800',
      },
      hesitacao: { mesesEspera: '18' },
      perfil: { urgencia: 'agora', objetivo: 'upgrade', rendaMensal: '12.000' },
      apresentacao: true,
    }
    expect(deQueryString(paraQueryString(estado))).toEqual(estado)
  })

  it('volta ao sugerido quando falta parâmetro ou a opção é inválida', () => {
    const estado = deQueryString('?tipo=barco&sist=xyz&prazo=150')
    expect(estado.simulacao.tipo).toBe('imovel')
    expect(estado.simulacao.sistema).toBe(formularioDoTipo('imovel').sistema)
    expect(estado.simulacao.prazoMeses).toBe('150')
    expect(estado.perfil).toEqual(PERFIL_INICIAL)
  })

  it('sem query, abre o exemplo inicial', () => {
    expect(deQueryString('')).toEqual(inicial)
  })

  it('pode tirar a renda do cliente do link', () => {
    const estado = { ...inicial, perfil: { ...PERFIL_INICIAL, rendaMensal: '9.000' } }
    expect(paraQueryString(estado)).toContain('renda=')
    expect(paraQueryString(estado, { semRenda: true })).toBe('tipo=imovel')
  })
})
