import { useState } from 'react'

type Estado = 'parado' | 'copiado' | 'falhou'

const ROTULO: Record<Estado, string> = {
  parado: 'Copiar link da simulação',
  copiado: 'Link copiado',
  falhou: 'Não foi possível copiar',
}

/** Copia o endereço atual, que já carrega a simulação na query string. */
export function CopiarLink() {
  const [estado, setEstado] = useState<Estado>('parado')

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setEstado('copiado')
    } catch {
      setEstado('falhou')
    }
    setTimeout(() => setEstado('parado'), 2500)
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="justify-self-start rounded-md border border-destaque px-3 py-2 text-sm font-medium text-destaque hover:bg-destaque-suave focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destaque"
    >
      <span aria-live="polite">{ROTULO[estado]}</span>
    </button>
  )
}
