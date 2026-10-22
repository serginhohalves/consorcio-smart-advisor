/** Erro de validação de entrada de uma simulação. */
export class ValidationError extends Error {
  readonly field: string

  constructor(field: string, message: string) {
    super(message)
    this.name = 'ValidationError'
    this.field = field
  }
}

export function assertPositiveInteger(field: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new ValidationError(field, `${field} deve ser um inteiro positivo`)
  }
}

export function assertFractionInRange(
  field: string,
  value: number,
  min: number,
  max: number,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new ValidationError(field, `${field} deve estar entre ${min} e ${max}`)
  }
}
