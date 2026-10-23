interface Opcao<T extends string> {
  valor: T
  rotulo: string
}

interface SegmentadoProps<T extends string> {
  nome: string
  rotulo: string
  opcoes: readonly Opcao<T>[]
  valor: T
  aoMudar: (valor: T) => void
}

export function Segmentado<T extends string>({
  nome,
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: SegmentadoProps<T>) {
  return (
    <fieldset className="grid gap-1">
      <legend className="mb-1 text-sm font-medium">{rotulo}</legend>
      <div className="grid grid-cols-2 overflow-hidden rounded-md border border-linha">
        {opcoes.map((opcao) => (
          <label
            key={opcao.valor}
            className="cursor-pointer py-2 text-center text-sm text-suave has-checked:bg-destaque has-checked:font-semibold has-checked:text-superficie has-focus-visible:outline-2 has-focus-visible:outline-destaque"
          >
            <input
              type="radio"
              name={nome}
              value={opcao.valor}
              checked={valor === opcao.valor}
              onChange={() => aoMudar(opcao.valor)}
              className="sr-only"
            />
            {opcao.rotulo}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
