const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

const percent = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formata um valor em centavos como moeda brasileira (ex.: 123456 -> "R$ 1.234,56"). */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100)
}

/** Formata uma fração como porcentagem (ex.: 0.15 -> "15,00%"). */
export function formatPercent(fraction: number): string {
  return percent.format(fraction)
}

const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

/** Formata um número como o usuário digitaria (ex.: 300000 -> "300.000", 10.5 -> "10,5"). */
export function formatDecimalBR(valor: number): string {
  return decimal.format(valor)
}
