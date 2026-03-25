export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-surface-800 bg-surface-950/50 shrink-0">
      <div>
        <h1 className="text-[15px] font-semibold text-surface-100 tracking-tight">{title}</h1>
        {subtitle && <p className="text-[12px] text-surface-500 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
