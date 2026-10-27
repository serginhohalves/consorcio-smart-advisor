import { describe, expect, it } from 'vitest'
import { simularConsorcio } from '../use-cases/simularConsorcio'
import { simularFinanciamento } from '../use-cases/simularFinanciamento'
import { IOF_PESSOA_FISICA } from './financiamento'
import { PARAMETROS_POR_TIPO } from './tipoConsorcio'

describe('PARAMETROS_POR_TIPO', () => {
  it.each(Object.entries(PARAMETROS_POR_TIPO))('%s gera uma simulação válida', (_, p) => {
    expect(() =>
      simularConsorcio({
        valorCarta: p.valorCarta,
        prazoMeses: p.prazoMeses,
        taxaAdministracao: p.taxaAdministracao,
        fundoReserva: p.fundoReserva,
        mesContemplacao: 12,
        reajusteAnual: p.reajusteAnualBem,
      }),
    ).not.toThrow()
    expect(() =>
      simularFinanciamento({
        valorFinanciado: p.valorCarta,
        prazoMeses: p.prazoMeses,
        taxaJurosAnual: p.taxaJurosAnual,
        sistema: p.sistema,
        iof: p.cobraIof ? IOF_PESSOA_FISICA : undefined,
      }),
    ).not.toThrow()
  })

  it('isenta de IOF só o imóvel', () => {
    expect(PARAMETROS_POR_TIPO.imovel.cobraIof).toBe(false)
    expect(PARAMETROS_POR_TIPO.veiculo.cobraIof).toBe(true)
  })
})
