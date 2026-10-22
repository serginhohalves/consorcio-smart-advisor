/** Valor monetário em centavos (inteiro). Ex.: R$ 1.234,56 = 123456. */
export type Cents = number

export function toCents(reais: number): Cents {
  return Math.round(reais * 100)
}

/**
 * Divide um total em `parts` parcelas inteiras cuja soma é exatamente o total.
 * Os centavos que sobram da divisão vão para as primeiras parcelas.
 */
export function splitEvenly(total: Cents, parts: number): Cents[] {
  if (parts <= 0) return []
  const base = Math.floor(total / parts)
  const remainder = total - base * parts
  return Array.from({ length: parts }, (_, i) => (i < remainder ? base + 1 : base))
}

export function sum(values: readonly Cents[]): Cents {
  return values.reduce((acc, v) => acc + v, 0)
}
