// ============================================================
// Sample data for Contractor Suite
// Matches localStorage schema from storage.js / constants.js
// ============================================================

// ---- Employees ----
export const SAMPLE_EMPLOYEES = [
  {
    id: 'emp_1001',
    name: 'Mike Donovan',
    adpFileNumber: '1001',
    classification: 'Foreman',
    projectRates: [
      { projectNo: 'CONTRACT-2401', rate: 120, type: 'hourly' },
      { projectNo: 'CONTRACT-2403', rate: 125, type: 'hourly' },
    ],
  },
  {
    id: 'emp_1002',
    name: 'Sarah Chen',
    adpFileNumber: '1002',
    classification: 'Electrician',
    projectRates: [
      { projectNo: 'CONTRACT-2402', rate: 100, type: 'hourly' },
      { projectNo: 'CONTRACT-2405', rate: 105, type: 'hourly' },
    ],
  },
  {
    id: 'emp_1003',
    name: 'Tyler Brooks',
    adpFileNumber: '1003',
    classification: 'Electrician',
    projectRates: [
      { projectNo: 'CONTRACT-2402', rate: 98, type: 'hourly' },
      { projectNo: 'CONTRACT-2401', rate: 100, type: 'hourly' },
    ],
  },
  {
    id: 'emp_1004',
    name: 'James Wilder',
    adpFileNumber: '1004',
    classification: 'Labourer',
    projectRates: [
      { projectNo: 'CONTRACT-2401', rate: 78, type: 'hourly' },
      { projectNo: 'CONTRACT-2404', rate: 82, type: 'hourly' },
    ],
  },
  {
    id: 'emp_1005',
    name: 'Priya Nair',
    adpFileNumber: '1005',
    classification: 'Operator',
    projectRates: [
      { projectNo: 'CONTRACT-2403', rate: 92, type: 'hourly' },
      { projectNo: 'CONTRACT-2404', rate: 95, type: 'hourly' },
    ],
  },
  {
    id: 'emp_1006',
    name: 'Dan Kowalski',
    adpFileNumber: '1006',
    classification: 'Foreman',
    projectRates: [
      { projectNo: 'CONTRACT-2404', rate: 118, type: 'hourly' },
      { projectNo: 'CONTRACT-2405', rate: 115, type: 'hourly' },
    ],
  },
  {
    id: 'emp_1007',
    name: 'Lisa Tran',
    adpFileNumber: '1007',
    classification: 'Electrician',
    projectRates: [
      { projectNo: 'CONTRACT-2405', rate: 102, type: 'hourly' },
      { projectNo: 'CONTRACT-2403', rate: 98, type: 'hourly' },
    ],
  },
  {
    id: 'emp_1008',
    name: 'Marcus Webb',
    adpFileNumber: '1008',
    classification: 'Labourer',
    projectRates: [
      { projectNo: 'CONTRACT-2403', rate: 75, type: 'hourly' },
      { projectNo: 'CONTRACT-2401', rate: 80, type: 'hourly' },
    ],
  },
]

// ---- Contracts ----
function makeCostCodes(rates) {
  return [
    { code: '01-FORE', description: 'Foreman Labour', unit: 'hours', rate: rates[0], budgetQty: 500 },
    { code: '02-JOUR', description: 'Journeyman Labour', unit: 'hours', rate: rates[1], budgetQty: 800 },
    { code: '03-LABC', description: 'General Labour', unit: 'hours', rate: rates[2], budgetQty: 600 },
    { code: '04-EQOP', description: 'Equipment Operator', unit: 'hours', rate: rates[3], budgetQty: 400 },
    { code: '05-EQIP', description: 'Equipment Hourly', unit: 'hours', rate: rates[4], budgetQty: 300 },
  ]
}

export const SAMPLE_CONTRACTS = [
  {
    id: 'con_2401',
    contractNo: 'CONTRACT-2401',
    clientName: 'Copper Creek Mine',
    clientAddress: '12500 Copper Creek Rd, Logan Lake, BC V0K 1W0',
    costCodes: makeCostCodes([120, 98, 78, 90, 165]),
    status: 'active',
  },
  {
    id: 'con_2402',
    contractNo: 'CONTRACT-2402',
    clientName: 'Northgate Industrial',
    clientAddress: '8800 Northgate Way, Prince George, BC V2N 4P4',
    costCodes: makeCostCodes([125, 105, 82, 95, 175]),
    status: 'active',
  },
  {
    id: 'con_2403',
    contractNo: 'CONTRACT-2403',
    clientName: 'Pacific Aggregates',
    clientAddress: '3400 Quarry Rd, Abbotsford, BC V2S 7T1',
    costCodes: makeCostCodes([122, 100, 80, 92, 170]),
    status: 'active',
  },
  {
    id: 'con_2404',
    contractNo: 'CONTRACT-2404',
    clientName: 'Ridgeline Resources',
    clientAddress: '450 Ridgeline Blvd, Kamloops, BC V2C 5N3',
    costCodes: makeCostCodes([118, 95, 75, 88, 160]),
    status: 'active',
  },
  {
    id: 'con_2405',
    contractNo: 'CONTRACT-2405',
    clientName: 'Summit Hydro',
    clientAddress: '700 Penstock Lane, Revelstoke, BC V0E 2S0',
    costCodes: makeCostCodes([115, 102, 80, 93, 168]),
    status: 'active',
  },
]

// ---- Timesheets ----
// Array indices: [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
// Week 1: March 2-8, 2025 (work days Mon Mar 3 - Fri Mar 7)
// Week 2: March 9-15, 2025 (work days Mon Mar 10 - Fri Mar 14)

// Helper: zeros with overrides at specific day indices
function hrs(overrides) {
  const a = [0, 0, 0, 0, 0, 0, 0]
  for (const [day, val] of Object.entries(overrides)) {
    a[Number(day)] = val
  }
  return a
}

export const SAMPLE_TIMESHEETS = [
  // ======== WEEK 1: March 3-7, 2025 ========
  {
    id: 'ts_wk1',
    weekStart: '2025-03-02',
    status: 'submitted',
    rows: [
      // --- Mike Donovan (Foreman) - primary on Copper Creek, some Pacific Agg ---
      {
        employeeId: 'emp_1001', employeeName: 'Mike Donovan', classification: 'Foreman',
        projectNo: 'CONTRACT-2401', costCode: '01-FORE', worksite: 'Copper Creek Mine',
        contractHrs: hrs({ 1: 8, 2: 9, 3: 8, 4: 8, 5: 8 }),    // 41 contract
        extraWorkHrs: hrs({ 3: 1 }),                               // 1 extra
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1001', employeeName: 'Mike Donovan', classification: 'Foreman',
        projectNo: 'CONTRACT-2403', costCode: '01-FORE', worksite: 'Pacific Aggregates',
        contractHrs: hrs({}),
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({ 6: 4 }),                               // Saturday company time
      },

      // --- Sarah Chen (Journeyman Electrician) - Northgate + Summit ---
      {
        employeeId: 'emp_1002', employeeName: 'Sarah Chen', classification: 'Electrician',
        projectNo: 'CONTRACT-2402', costCode: '02-JOUR', worksite: 'Northgate Industrial',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 10, 4: 8, 5: 8 }),    // 42 contract (10hr day Wed triggers OT)
        extraWorkHrs: hrs({ 2: 1 }),                               // 1 extra Tue
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1002', employeeName: 'Sarah Chen', classification: 'Electrician',
        projectNo: 'CONTRACT-2405', costCode: '02-JOUR', worksite: 'Summit Hydro',
        contractHrs: hrs({}),
        extraWorkHrs: hrs({ 5: 2 }),                               // 2 extra work Fri
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- Tyler Brooks (Journeyman Electrician) - Northgate + Copper Creek ---
      {
        employeeId: 'emp_1003', employeeName: 'Tyler Brooks', classification: 'Electrician',
        projectNo: 'CONTRACT-2402', costCode: '02-JOUR', worksite: 'Northgate Industrial',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 8, 4: 9, 5: 8 }),     // 41 contract
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({ 4: 1 }),                               // 1 standby Thu
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1003', employeeName: 'Tyler Brooks', classification: 'Electrician',
        projectNo: 'CONTRACT-2401', costCode: '02-JOUR', worksite: 'Copper Creek Mine',
        contractHrs: hrs({}),
        extraWorkHrs: hrs({ 1: 2 }),                               // 2 extra Mon
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- James Wilder (Labourer) - Copper Creek + Ridgeline ---
      {
        employeeId: 'emp_1004', employeeName: 'James Wilder', classification: 'Labourer',
        projectNo: 'CONTRACT-2401', costCode: '03-LABC', worksite: 'Copper Creek Mine',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 8 }),                   // 24
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1004', employeeName: 'James Wilder', classification: 'Labourer',
        projectNo: 'CONTRACT-2404', costCode: '03-LABC', worksite: 'Ridgeline Resources',
        contractHrs: hrs({ 4: 8, 5: 8 }),                         // 16
        extraWorkHrs: hrs({ 4: 1 }),                               // 1 extra Thu
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- Priya Nair (Equipment Operator) - Pacific Agg + Ridgeline ---
      {
        employeeId: 'emp_1005', employeeName: 'Priya Nair', classification: 'Operator',
        projectNo: 'CONTRACT-2403', costCode: '04-EQOP', worksite: 'Pacific Aggregates',
        contractHrs: hrs({ 1: 9, 2: 9, 3: 8, 4: 8 }),            // 34 (two 9hr days)
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1005', employeeName: 'Priya Nair', classification: 'Operator',
        projectNo: 'CONTRACT-2404', costCode: '04-EQOP', worksite: 'Ridgeline Resources',
        contractHrs: hrs({ 5: 8 }),                                // 8
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({ 5: 2 }),                               // 2 standby Fri
        companyHrs:   hrs({}),
      },

      // --- Dan Kowalski (Foreman) - Ridgeline + Summit ---
      {
        employeeId: 'emp_1006', employeeName: 'Dan Kowalski', classification: 'Foreman',
        projectNo: 'CONTRACT-2404', costCode: '01-FORE', worksite: 'Ridgeline Resources',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 10, 4: 8 }),           // 34 (10hr Wed)
        extraWorkHrs: hrs({ 3: 1 }),                               // 1 extra Wed
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1006', employeeName: 'Dan Kowalski', classification: 'Foreman',
        projectNo: 'CONTRACT-2405', costCode: '01-FORE', worksite: 'Summit Hydro',
        contractHrs: hrs({ 5: 8 }),                                // 8
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- Lisa Tran (Journeyman Electrician) - Summit + Pacific Agg ---
      {
        employeeId: 'emp_1007', employeeName: 'Lisa Tran', classification: 'Electrician',
        projectNo: 'CONTRACT-2405', costCode: '02-JOUR', worksite: 'Summit Hydro',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 8, 4: 8, 5: 8 }),     // 40
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1007', employeeName: 'Lisa Tran', classification: 'Electrician',
        projectNo: 'CONTRACT-2403', costCode: '02-JOUR', worksite: 'Pacific Aggregates',
        contractHrs: hrs({}),
        extraWorkHrs: hrs({ 2: 2 }),                               // 2 extra Tue
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- Marcus Webb (Labourer) - Pacific Agg + Copper Creek ---
      {
        employeeId: 'emp_1008', employeeName: 'Marcus Webb', classification: 'Labourer',
        projectNo: 'CONTRACT-2403', costCode: '03-LABC', worksite: 'Pacific Aggregates',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 8, 4: 8, 5: 8 }),     // 40
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1008', employeeName: 'Marcus Webb', classification: 'Labourer',
        projectNo: 'CONTRACT-2401', costCode: '03-LABC', worksite: 'Copper Creek Mine',
        contractHrs: hrs({}),
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({ 6: 4 }),                               // 4 standby Sat
        companyHrs:   hrs({}),
      },
    ],
  },

  // ======== WEEK 2: March 10-14, 2025 ========
  {
    id: 'ts_wk2',
    weekStart: '2025-03-09',
    status: 'draft',
    rows: [
      // --- Mike Donovan - heavy week to hit weekly OT (44 total) ---
      {
        employeeId: 'emp_1001', employeeName: 'Mike Donovan', classification: 'Foreman',
        projectNo: 'CONTRACT-2401', costCode: '01-FORE', worksite: 'Copper Creek Mine',
        contractHrs: hrs({ 1: 9, 2: 9, 3: 10, 4: 9, 5: 9 }),    // 46 contract (daily OT + weekly OT)
        extraWorkHrs: hrs({ 2: 1, 4: 1 }),                        // 2 extra
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- Sarah Chen - 42 hrs ---
      {
        employeeId: 'emp_1002', employeeName: 'Sarah Chen', classification: 'Electrician',
        projectNo: 'CONTRACT-2402', costCode: '02-JOUR', worksite: 'Northgate Industrial',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 8, 4: 10, 5: 8 }),    // 42 contract (10hr Thu)
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1002', employeeName: 'Sarah Chen', classification: 'Electrician',
        projectNo: 'CONTRACT-2405', costCode: '02-JOUR', worksite: 'Summit Hydro',
        contractHrs: hrs({}),
        extraWorkHrs: hrs({ 3: 1.5 }),                             // 1.5 extra Wed
        standbyHrs:   hrs({}),
        companyHrs:   hrs({ 6: 3 }),                               // 3 company Sat
      },

      // --- Tyler Brooks - Northgate ---
      {
        employeeId: 'emp_1003', employeeName: 'Tyler Brooks', classification: 'Electrician',
        projectNo: 'CONTRACT-2402', costCode: '02-JOUR', worksite: 'Northgate Industrial',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 8, 4: 8, 5: 8 }),     // 40
        extraWorkHrs: hrs({ 5: 2 }),                               // 2 extra Fri  -> 42 total
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- James Wilder - split Copper Creek / Ridgeline + standby ---
      {
        employeeId: 'emp_1004', employeeName: 'James Wilder', classification: 'Labourer',
        projectNo: 'CONTRACT-2401', costCode: '03-LABC', worksite: 'Copper Creek Mine',
        contractHrs: hrs({ 1: 8, 2: 8 }),                         // 16
        extraWorkHrs: hrs({ 1: 1 }),                               // 1 extra Mon
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1004', employeeName: 'James Wilder', classification: 'Labourer',
        projectNo: 'CONTRACT-2404', costCode: '03-LABC', worksite: 'Ridgeline Resources',
        contractHrs: hrs({ 3: 9, 4: 9, 5: 8 }),                   // 26 (two 9hr days)
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({ 6: 4 }),                               // 4 standby Sat
        companyHrs:   hrs({}),
      },

      // --- Priya Nair - Pacific Agg heavy week (43 hrs) + Ridgeline ---
      {
        employeeId: 'emp_1005', employeeName: 'Priya Nair', classification: 'Operator',
        projectNo: 'CONTRACT-2403', costCode: '04-EQOP', worksite: 'Pacific Aggregates',
        contractHrs: hrs({ 1: 10, 2: 9, 3: 10, 4: 9, 5: 8 }),   // 46 (three 9-10hr days -> daily OT + weekly OT)
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- Dan Kowalski - Ridgeline + Summit ---
      {
        employeeId: 'emp_1006', employeeName: 'Dan Kowalski', classification: 'Foreman',
        projectNo: 'CONTRACT-2404', costCode: '01-FORE', worksite: 'Ridgeline Resources',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 8 }),                   // 24
        extraWorkHrs: hrs({ 2: 2 }),                               // 2 extra Tue
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1006', employeeName: 'Dan Kowalski', classification: 'Foreman',
        projectNo: 'CONTRACT-2405', costCode: '01-FORE', worksite: 'Summit Hydro',
        contractHrs: hrs({ 4: 8, 5: 8 }),                         // 16
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({ 6: 4 }),                               // 4 company Sat
      },

      // --- Lisa Tran - Summit + Pacific Agg, hits 41 hrs ---
      {
        employeeId: 'emp_1007', employeeName: 'Lisa Tran', classification: 'Electrician',
        projectNo: 'CONTRACT-2405', costCode: '02-JOUR', worksite: 'Summit Hydro',
        contractHrs: hrs({ 1: 8, 2: 9, 3: 8, 4: 8 }),            // 33
        extraWorkHrs: hrs({}),
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
      {
        employeeId: 'emp_1007', employeeName: 'Lisa Tran', classification: 'Electrician',
        projectNo: 'CONTRACT-2403', costCode: '02-JOUR', worksite: 'Pacific Aggregates',
        contractHrs: hrs({ 5: 8 }),                                // 8  -> 41 total
        extraWorkHrs: hrs({ 5: 1 }),                               // 1 extra Fri
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },

      // --- Marcus Webb - Pacific Agg + standby Copper Creek ---
      {
        employeeId: 'emp_1008', employeeName: 'Marcus Webb', classification: 'Labourer',
        projectNo: 'CONTRACT-2403', costCode: '03-LABC', worksite: 'Pacific Aggregates',
        contractHrs: hrs({ 1: 8, 2: 8, 3: 8, 4: 8, 5: 8 }),     // 40
        extraWorkHrs: hrs({ 1: 1, 3: 1 }),                        // 2 extra -> 42 total
        standbyHrs:   hrs({}),
        companyHrs:   hrs({}),
      },
    ],
  },
]

// ---- Company settings ----
export const SAMPLE_COMPANY_SETTINGS = {
  companyName: 'Westcoast Electrical Contractors Ltd.',
  address: '2840 Lougheed Hwy, Unit 12',
  city: 'Coquitlam',
  province: 'BC',
  postalCode: 'V3B 6P1',
  phone: '604-555-0187',
  email: 'billing@westcoastec.ca',
  gstNumber: '712345678 RT0001',
  invoicePrefix: 'WEC-',
  nextInvoiceNumber: 1001,
  paymentTerms: 'Net 30',
  logo: null,
}
