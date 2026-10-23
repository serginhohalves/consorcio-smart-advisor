import type { ReactNode } from 'react'

export interface Linha {
  rotulo: string
  valor: ReactNode
}

export function CardResultado({ titulo, linhas }: { titulo: string; linhas: Linha[] }) {
  return (
    <article className="grid min-w-0 content-start gap-3 rounded-xl border border-linha bg-superficie p-5">
      <h3 className="font-display text-lg font-semibold">{titulo}</h3>
      <dl className="grid gap-2">
        {linhas.map((linha) => (
          <div
            key={linha.rotulo}
            className="flex justify-between gap-3 border-b border-dashed border-linha pb-1.5"
          >
            <dt className="text-sm text-suave">{linha.rotulo}</dt>
            <dd className="text-right font-mono text-sm tabular-nums">{linha.valor}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
