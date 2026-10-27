import { describe, expect, it } from 'vitest'
import { analisarPerfil, calcularCustoHesitacao } from '../core'
import { linkWhatsApp, resumoWhatsApp } from './resumo'
import { FORMULARIO_INICIAL, simular } from './simulacao'

const simulacao = simular(FORMULARIO_INICIAL)
if (!simulacao.ok) throw new Error('simulação inicial inválida')

const base = {
  simulacao,
  tipo: 'imovel' as const,
  perfil: null,
  hesitacao: null,
  link: 'https://exemplo.dev/?tipo=imovel',
}

describe('resumoWhatsApp', () => {
  it('traz carta, lance, parcelas, economia e o link', () => {
    const texto = resumoWhatsApp(base)
    expect(texto).toContain('*Consórcio x Financiamento: Imóvel*')
    expect(texto).toMatch(/Carta de crédito: R\$\s300\.000,00 em 200 parcelas/)
    expect(texto).toMatch(/Lance: R\$\s90\.000,00 no mês 12/)
    expect(texto).toMatch(/Consórcio: R\$\s1\.740,00/)
    expect(texto).toContain('*Economia com o consórcio:')
    expect(texto).toContain('descontando 10% a.a.')
    expect(texto).toContain('Simulação completa: https://exemplo.dev/?tipo=imovel')
  })

  it('inclui perfil e custo da hesitação quando existem', () => {
    const perfil = analisarPerfil({
      urgencia: 'mais1ano',
      objetivo: 'planejamento',
      economiaPercentual: 0.2,
      lancePercentual: 0.3,
      comprometimentoRenda: null,
    })
    const resultado = calcularCustoHesitacao({
      valorBem: 30_000_000,
      recursosProprios: 9_000_000,
      mesesEspera: 12,
      reajusteAnualBem: 0.05,
      rendimentoAnualAplicacao: 0.1,
    })
    const texto = resumoWhatsApp({ ...base, perfil, hesitacao: { resultado, mesesEspera: 12 } })
    expect(texto).toContain('Termômetro de perfil: Perfil consórcio (100/100)')
    expect(texto).toMatch(/Esperar 12 meses para decidir custa R\$\s6\.000,00/)
  })

  it('indica quando o financiamento sai mais barato', () => {
    const caro = simular({ ...FORMULARIO_INICIAL, aluguelMensal: '5.000' })
    if (!caro.ok) throw new Error(caro.mensagem)
    expect(resumoWhatsApp({ ...base, simulacao: caro })).toContain(
      '*Diferença a favor do financiamento:',
    )
  })
})

describe('linkWhatsApp', () => {
  it('codifica o texto para o wa.me', () => {
    expect(linkWhatsApp('a b\n*c*')).toBe('https://wa.me/?text=a%20b%0A*c*')
  })
})
