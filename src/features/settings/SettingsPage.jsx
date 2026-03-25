import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import { useToast } from '../../components/Toast'
import { useLocalStorage } from '../../lib/hooks'
import { STORAGE_KEYS, DEFAULT_COMPANY_SETTINGS } from '../../lib/constants'
import { getStorageUsage } from '../../lib/storage'
import { loadSampleData } from '../../data/seedLoader'

export default function SettingsPage() {
  const toast = useToast()
  const [settings, setSettings] = useLocalStorage(STORAGE_KEYS.COMPANY_SETTINGS, DEFAULT_COMPANY_SETTINGS)
  const [tab, setTab] = useState('company')

  const storageUsed = getStorageUsage()
  const storageLimit = 5 * 1024 * 1024
  const storagePct = (storageUsed / storageLimit * 100).toFixed(1)

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 500000) {
      toast.error('Logo must be under 500KB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      handleChange('logo', ev.target.result)
      toast.success('Logo uploaded')
    }
    reader.readAsDataURL(file)
  }

  const handleExportBackup = () => {
    const data = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('cs_')) {
        data[key] = localStorage.getItem(key)
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contractor_suite_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Backup downloaded')
  }

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        let count = 0
        for (const [key, val] of Object.entries(data)) {
          if (key.startsWith('cs_')) {
            localStorage.setItem(key, val)
            count++
          }
        }
        toast.success(`Restored ${count} data entries. Refresh the page to see changes.`)
      } catch {
        toast.error('Invalid backup file')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearData = () => {
    if (!confirm('Are you sure? This will delete ALL app data.')) return
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i)
      if (key.startsWith('cs_')) localStorage.removeItem(key)
    }
    toast.success('All data cleared. Refresh the page.')
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Settings" subtitle="Company information and app configuration" />

      {/* Tabs */}
      <div className="flex border-b border-surface-800 px-5">
        {['company', 'invoicing', 'data'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2.5 text-[13px] font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-surface-600 hover:text-surface-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-2xl space-y-4">
          {tab === 'company' && (
            <>
              <Section title="Company Information">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Company Name</label>
                    <input value={settings.companyName || ''} onChange={e => handleChange('companyName', e.target.value)} className="input-field" placeholder="Your Company Inc." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Address</label>
                    <input value={settings.address || ''} onChange={e => handleChange('address', e.target.value)} className="input-field" placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">City</label>
                    <input value={settings.city || ''} onChange={e => handleChange('city', e.target.value)} className="input-field" placeholder="Vancouver" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Province</label>
                      <input value={settings.province || 'BC'} onChange={e => handleChange('province', e.target.value)} className="input-field" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Postal</label>
                      <input value={settings.postalCode || ''} onChange={e => handleChange('postalCode', e.target.value)} className="input-field" placeholder="V5K 1A1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Phone</label>
                    <input value={settings.phone || ''} onChange={e => handleChange('phone', e.target.value)} className="input-field" placeholder="604-555-0123" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Email</label>
                    <input value={settings.email || ''} onChange={e => handleChange('email', e.target.value)} className="input-field" placeholder="billing@company.ca" />
                  </div>
                </div>
              </Section>

              <Section title="Company Logo">
                <div className="flex items-center gap-4">
                  {settings.logo ? (
                    <div className="relative">
                      <img src={settings.logo} alt="Logo" className="h-14 rounded-[3px] border border-surface-800" />
                      <button
                        onClick={() => handleChange('logo', null)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full text-white text-[9px] flex items-center justify-center"
                      >
                        x
                      </button>
                    </div>
                  ) : (
                    <div className="h-14 w-20 rounded-[3px] border border-dashed border-surface-700 flex items-center justify-center text-surface-600 text-[11px]">
                      No logo
                    </div>
                  )}
                  <label className="btn-secondary text-[12px] cursor-pointer">
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <span className="text-[11px] text-surface-600">Max 500KB</span>
                </div>
              </Section>
            </>
          )}

          {tab === 'invoicing' && (
            <Section title="Invoice Configuration">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">GST Number</label>
                  <input value={settings.gstNumber || ''} onChange={e => handleChange('gstNumber', e.target.value)} className="input-field" placeholder="123456789 RT0001" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Payment Terms</label>
                  <select value={settings.paymentTerms || 'Net 30'} onChange={e => handleChange('paymentTerms', e.target.value)} className="input-field">
                    <option>Net 15</option>
                    <option>Net 30</option>
                    <option>Net 45</option>
                    <option>Net 60</option>
                    <option>Due on Receipt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Invoice Prefix</label>
                  <input value={settings.invoicePrefix || 'INV-'} onChange={e => handleChange('invoicePrefix', e.target.value)} className="input-field" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-surface-500 uppercase tracking-wider mb-1">Next Number</label>
                  <input type="number" value={settings.nextInvoiceNumber || 1001} onChange={e => handleChange('nextInvoiceNumber', parseInt(e.target.value) || 1001)} className="input-field" />
                </div>
              </div>
            </Section>
          )}

          {tab === 'data' && (
            <>
              <Section title="Storage">
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-surface-500">
                    <span>localStorage usage</span>
                    <span className="tabular-nums">{(storageUsed / 1024).toFixed(1)} KB / 5 MB ({storagePct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${parseFloat(storagePct) > 80 ? 'bg-red-500' : 'bg-brand-600'}`}
                      style={{ width: `${Math.min(parseFloat(storagePct), 100)}%` }}
                    />
                  </div>
                </div>
              </Section>

              <Section title="Backup & Restore">
                <div className="flex gap-2">
                  <button onClick={handleExportBackup} className="btn-primary text-[12px]">Export Backup</button>
                  <label className="btn-secondary text-[12px] cursor-pointer">
                    Import Backup
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>
                </div>
              </Section>

              <Section title="Sample Data">
                <div className="space-y-2">
                  <p className="text-[12px] text-surface-600">Load demo employees, contracts, and timesheets.</p>
                  <button
                    onClick={() => {
                      if (!confirm('This will overwrite existing data. Continue?')) return
                      const counts = loadSampleData()
                      toast.success(`Loaded ${counts.employees} employees, ${counts.contracts} contracts, ${counts.timesheets} timesheets. Refresh the page.`)
                    }}
                    className="btn-secondary text-[12px]"
                  >
                    Load Sample Data
                  </button>
                </div>
              </Section>

              <Section title="Danger Zone" danger>
                <button onClick={handleClearData} className="text-[13px] text-red-400 hover:text-red-300 font-medium border border-red-900/50 rounded-[3px] px-4 py-2 hover:bg-red-950/30 transition-colors">
                  Clear All Data
                </button>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, danger }) {
  return (
    <div className={`bg-surface-900 border rounded-[4px] p-4 ${danger ? 'border-red-900/30' : 'border-surface-800'}`}>
      <h3 className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${danger ? 'text-red-400' : 'text-surface-500'}`}>{title}</h3>
      {children}
    </div>
  )
}
