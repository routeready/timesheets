import { useState } from 'react'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { useToast } from '../../components/Toast'
import { useLocalStorage } from '../../lib/hooks'
import { STORAGE_KEYS, CLASSIFICATIONS } from '../../lib/constants'
import { generateId } from '../../lib/dates'

export default function RatesPage() {
  const toast = useToast()
  const [employees, setEmployees] = useLocalStorage(STORAGE_KEYS.EMPLOYEES, [])
  const [contracts, setContracts] = useLocalStorage(STORAGE_KEYS.CONTRACTS, [])
  const [tab, setTab] = useState('employees')
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [editingContract, setEditingContract] = useState(null)

  // ---- Employee rate management ----
  const handleSaveEmployee = (data) => {
    if (data.id) {
      setEmployees(prev => prev.map(e => e.id === data.id ? data : e))
      toast.success('Employee updated')
    } else {
      setEmployees(prev => [...prev, { ...data, id: generateId() }])
      toast.success('Employee added')
    }
    setEditingEmployee(null)
  }

  const handleDeleteEmployee = (emp) => {
    setEmployees(prev => prev.filter(e => e.id !== emp.id))
    toast.success('Employee removed')
  }

  // ---- Contract management ----
  const handleSaveContract = (data) => {
    if (data.id) {
      setContracts(prev => prev.map(c => c.id === data.id ? data : c))
      toast.success('Contract updated')
    } else {
      setContracts(prev => [...prev, { ...data, id: generateId() }])
      toast.success('Contract added')
    }
    setEditingContract(null)
  }

  const handleDeleteContract = (contract) => {
    setContracts(prev => prev.filter(c => c.id !== contract.id))
    toast.success('Contract removed')
  }

  const empColumns = [
    { header: 'Name', accessor: 'name' },
    { header: 'ADP File #', accessor: 'adpFileNumber' },
    { header: 'Classification', accessor: 'classification' },
    {
      header: 'Project Rates',
      accessor: 'projectRates',
      cell: (val) => (val || []).length > 0
        ? `${val.length} rate${val.length > 1 ? 's' : ''}`
        : <span className="text-surface-600">None</span>,
    },
  ]

  const contractColumns = [
    { header: 'Contract No.', accessor: 'contractNo' },
    { header: 'Client', accessor: 'clientName' },
    {
      header: 'Cost Codes',
      accessor: 'costCodes',
      cell: (val) => (val || []).length,
    },
    { header: 'Status', accessor: 'status', cell: (val) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${val === 'active' ? 'bg-emerald-600/20 text-emerald-400' : 'bg-surface-700 text-surface-400'}`}>
        {val || 'active'}
      </span>
    )},
  ]

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Rates & Contracts" subtitle="Manage employee rates and contract cost codes">
        {tab === 'employees' ? (
          <button onClick={() => setEditingEmployee({})} className="btn-primary text-xs">+ Add Employee</button>
        ) : (
          <button onClick={() => setEditingContract({ costCodes: [] })} className="btn-primary text-xs">+ Add Contract</button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-surface-800 px-6">
        {['employees', 'contracts'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-brand-500 text-brand-400' : 'border-transparent text-surface-500 hover:text-surface-300'
            }`}
          >
            {t} ({t === 'employees' ? employees.length : contracts.length})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tab === 'employees' ? (
          <DataTable
            columns={empColumns}
            data={employees}
            onRowClick={(emp) => setEditingEmployee(emp)}
            emptyMessage="No employees. Add employees to set up charge-out rates."
          />
        ) : (
          <DataTable
            columns={contractColumns}
            data={contracts}
            onRowClick={(c) => setEditingContract(c)}
            emptyMessage="No contracts. Add a contract to define cost codes and rates."
          />
        )}
      </div>

      {/* Employee modal */}
      <Modal open={editingEmployee != null} onClose={() => setEditingEmployee(null)} title={editingEmployee?.id ? 'Edit Employee' : 'Add Employee'} wide>
        {editingEmployee && (
          <EmployeeForm
            employee={editingEmployee}
            onSave={handleSaveEmployee}
            onDelete={editingEmployee.id ? () => { handleDeleteEmployee(editingEmployee); setEditingEmployee(null) } : null}
            onCancel={() => setEditingEmployee(null)}
          />
        )}
      </Modal>

      {/* Contract modal */}
      <Modal open={editingContract != null} onClose={() => setEditingContract(null)} title={editingContract?.id ? 'Edit Contract' : 'Add Contract'} wide>
        {editingContract && (
          <ContractForm
            contract={editingContract}
            onSave={handleSaveContract}
            onDelete={editingContract.id ? () => { handleDeleteContract(editingContract); setEditingContract(null) } : null}
            onCancel={() => setEditingContract(null)}
          />
        )}
      </Modal>
    </div>
  )
}

function EmployeeForm({ employee, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState({
    ...employee,
    name: employee.name || '',
    adpFileNumber: employee.adpFileNumber || '',
    classification: employee.classification || 'Journeyman',
    projectRates: employee.projectRates || [],
  })

  const addRate = () => {
    setForm(f => ({
      ...f,
      projectRates: [...f.projectRates, { projectNo: '', rate: 0, type: 'hourly' }],
    }))
  }

  const updateRate = (idx, field, value) => {
    setForm(f => ({
      ...f,
      projectRates: f.projectRates.map((r, i) =>
        i === idx ? { ...r, [field]: field === 'rate' ? parseFloat(value) || 0 : value } : r
      ),
    }))
  }

  const removeRate = (idx) => {
    setForm(f => ({ ...f, projectRates: f.projectRates.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">ADP File Number</label>
          <input value={form.adpFileNumber} onChange={e => setForm(f => ({ ...f, adpFileNumber: e.target.value }))} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">Classification</label>
          <select value={form.classification} onChange={e => setForm(f => ({ ...f, classification: e.target.value }))} className="input-field">
            {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Project Rates */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-surface-400">Project Charge-Out Rates</label>
          <button onClick={addRate} className="text-xs text-brand-400 hover:text-brand-300">+ Add Rate</button>
        </div>
        {form.projectRates.length === 0 ? (
          <p className="text-xs text-surface-600">No project-specific rates defined</p>
        ) : (
          <div className="space-y-2">
            {form.projectRates.map((rate, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={rate.projectNo}
                  onChange={e => updateRate(idx, 'projectNo', e.target.value)}
                  placeholder="Project #"
                  className="input-field text-xs flex-1"
                />
                <input
                  type="number"
                  value={rate.rate}
                  onChange={e => updateRate(idx, 'rate', e.target.value)}
                  placeholder="Rate"
                  className="input-field text-xs w-24"
                />
                <select value={rate.type} onChange={e => updateRate(idx, 'type', e.target.value)} className="input-field text-xs w-24">
                  <option value="hourly">$/hr</option>
                  <option value="daily">$/day</option>
                </select>
                <button onClick={() => removeRate(idx)} className="text-surface-600 hover:text-red-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <div>
          {onDelete && (
            <button onClick={onDelete} className="text-sm text-red-400 hover:text-red-300">Delete Employee</button>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button onClick={() => form.name && onSave(form)} disabled={!form.name} className="btn-primary text-sm disabled:opacity-40">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function ContractForm({ contract, onSave, onDelete, onCancel }) {
  const [form, setForm] = useState({
    ...contract,
    contractNo: contract.contractNo || '',
    clientName: contract.clientName || '',
    clientAddress: contract.clientAddress || '',
    costCodes: contract.costCodes || [],
    status: contract.status || 'active',
  })

  const addCostCode = () => {
    setForm(f => ({
      ...f,
      costCodes: [...f.costCodes, { code: '', description: '', unit: 'hours', rate: 0, budgetQty: 0 }],
    }))
  }

  const updateCostCode = (idx, field, value) => {
    setForm(f => ({
      ...f,
      costCodes: f.costCodes.map((cc, i) =>
        i === idx ? { ...cc, [field]: ['rate', 'budgetQty'].includes(field) ? parseFloat(value) || 0 : value } : cc
      ),
    }))
  }

  const removeCostCode = (idx) => {
    setForm(f => ({ ...f, costCodes: f.costCodes.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">Contract Number *</label>
          <input value={form.contractNo} onChange={e => setForm(f => ({ ...f, contractNo: e.target.value }))} className="input-field" />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-400 mb-1">Client Name *</label>
          <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="input-field" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-surface-400 mb-1">Client Address</label>
          <input value={form.clientAddress} onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))} className="input-field" />
        </div>
      </div>

      {/* Cost Codes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-surface-400">Cost Codes</label>
          <button onClick={addCostCode} className="text-xs text-brand-400 hover:text-brand-300">+ Add Cost Code</button>
        </div>
        {form.costCodes.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-surface-700">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-800 text-surface-400">
                  <th className="px-2 py-1.5 text-left">Code</th>
                  <th className="px-2 py-1.5 text-left">Description</th>
                  <th className="px-2 py-1.5 text-left">Unit</th>
                  <th className="px-2 py-1.5 text-left">Rate</th>
                  <th className="px-2 py-1.5 text-left">Budget Qty</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {form.costCodes.map((cc, idx) => (
                  <tr key={idx} className="border-t border-surface-800">
                    <td className="px-1 py-1"><input value={cc.code} onChange={e => updateCostCode(idx, 'code', e.target.value)} className="input-field text-xs" placeholder="03-100" /></td>
                    <td className="px-1 py-1"><input value={cc.description} onChange={e => updateCostCode(idx, 'description', e.target.value)} className="input-field text-xs" placeholder="Description" /></td>
                    <td className="px-1 py-1">
                      <select value={cc.unit} onChange={e => updateCostCode(idx, 'unit', e.target.value)} className="input-field text-xs">
                        {['hours', 'each', 'lump sum', 'tonnes', 'm3', 'm2', 'lineal m', 'kg', 'days'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="px-1 py-1"><input type="number" value={cc.rate} onChange={e => updateCostCode(idx, 'rate', e.target.value)} className="input-field text-xs w-20" /></td>
                    <td className="px-1 py-1"><input type="number" value={cc.budgetQty} onChange={e => updateCostCode(idx, 'budgetQty', e.target.value)} className="input-field text-xs w-20" /></td>
                    <td className="px-1 py-1">
                      <button onClick={() => removeCostCode(idx)} className="text-surface-600 hover:text-red-400">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <div>
          {onDelete && <button onClick={onDelete} className="text-sm text-red-400 hover:text-red-300">Delete Contract</button>}
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
          <button
            onClick={() => form.contractNo && form.clientName && onSave(form)}
            disabled={!form.contractNo || !form.clientName}
            className="btn-primary text-sm disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
