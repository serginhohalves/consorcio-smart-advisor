/**
 * Converte um número digitado no padrão brasileiro: "1.234,56", "1234,5",
 * "300.000" (milhar) ou "10.5". Retorna NaN se não for um número.
 */
export function parseDecimalBR(texto: string): number {
  const limpo = texto.trim().replace(/\s/g, '')
  if (limpo === '') return Number.NaN
  if (limpo.includes(',')) return Number(limpo.replace(/\./g, '').replace(',', '.'))
  if (/^\d{1,3}(\.\d{3})+$/.test(limpo)) return Number(limpo.replace(/\./g, ''))
  return Number(limpo)
}
