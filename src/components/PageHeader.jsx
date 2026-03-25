export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800">
      <div>
        <h1 className="text-xl font-semibold text-surface-100">{title}</h1>
        {subtitle && <p className="text-sm text-surface-400 mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
