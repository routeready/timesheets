import { useEffect, useRef } from 'react'

export default function Modal({ open, onClose, title, children, wide = false }) {
  const overlayRef = useRef()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className={`bg-surface-900 border border-surface-800 rounded-[4px] shadow-2xl ${wide ? 'max-w-3xl' : 'max-w-lg'} w-full mx-4 max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-800">
          <h2 className="text-[14px] font-semibold text-surface-100 tracking-tight">{title}</h2>
          <button onClick={onClose} className="text-surface-600 hover:text-surface-400 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
