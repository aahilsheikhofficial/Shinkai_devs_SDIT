import { useEffect, useState } from 'react'
import { CheckCircle2, AlertTriangle } from 'lucide-react'

type T = { id: number; text: string; ok: boolean }
let push: (t: T) => void = () => {}
let n = 0
/** Short confirmation or error after an action. */
export const notify = (text: string, ok = true) => push({ id: ++n, text, ok })

export function Toaster() {
  const [items, setItems] = useState<T[]>([])
  useEffect(() => { push = t => { setItems(x => [...x, t]); setTimeout(() => setItems(x => x.filter(y => y.id !== t.id)), 5000) } }, [])
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2" role="status" aria-live="polite">
      {items.map(t => (
        <div key={t.id} className="card flex items-start gap-2 !rounded-2xl px-4 py-3 text-sm shadow-lg">
          {t.ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-t-free" /> : <AlertTriangle size={17} className="mt-0.5 shrink-0 text-t-severe" />}
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}
