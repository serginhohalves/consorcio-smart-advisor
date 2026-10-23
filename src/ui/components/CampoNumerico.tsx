interface CampoNumericoProps {
  id: string
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  sufixo?: string
  prefixo?: string
  dica?: string
  erro?: string
}

export function CampoNumerico({
  id,
  rotulo,
  valor,
  aoMudar,
  sufixo,
  prefixo,
  dica,
  erro,
}: CampoNumericoProps) {
  const idDescricao = erro || dica ? `${id}-descricao` : undefined

  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <div
        className={`flex items-center rounded-md border bg-fundo focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-destaque ${
          erro ? 'border-negativo' : 'border-linha'
        }`}
      >
        {prefixo && (
          <span className="pl-3 font-mono text-sm whitespace-nowrap text-suave">{prefixo}</span>
        )}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={idDescricao}
          className="w-full min-w-0 bg-transparent px-3 py-2 font-mono text-base tabular-nums outline-none"
        />
        {sufixo && (
          <span className="pr-3 font-mono text-sm whitespace-nowrap text-suave">{sufixo}</span>
        )}
      </div>
      {(erro || dica) && (
        <p id={idDescricao} className={`text-xs ${erro ? 'text-negativo' : 'text-suave'}`}>
          {erro ?? dica}
        </p>
      )}
    </div>
  )
}
