import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';

// Import components
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiReport from './components/reports/KpiReport';
import ConsumablesReport from './components/reports/ConsumablesReport';
import OTReport from './components/reports/OTReport';
import LeaveReport from './components/reports/LeaveReport';
import AccidentReport from './components/reports/AccidentReport';
import WorkloadReport from './components/reports/WorkloadReport';
import PlaceholderPage from './components/PlaceholderPage';
import LoadingSpinner from './components/LoadingSpinner';

// Import types
import { Kpi, TableRow, ConsumableRow, OtRow, LeaveRow, AccidentRow, WorkloadProductSection, ChartDataPoint } from './types';
import { useTranslation } from './context/LanguageProvider';

// Import constants and services
import { DB_STORAGE_KEY, getKpiIcon, modifySpecificKpiScore, parseValue } from './constants';
import { saveToFirestore, getFromFirestore, isFirebaseConnected, testFirebaseConnection, clearFirestoreCollection } from './services/firebase';

declare const Swal: any;

// Define the shape of our application's data
interface AppData {
    kpiReport: { kpis: Kpi[]; tableRows: TableRow[]; };
    consumablesReport: { 
        tableData: ConsumableRow[]; 
        kpis: Kpi[]; 
        chartData: ChartDataPoint[]; 
        topItems: { name: string; frequency: number; totalCost: number; material: string; }[]; 
        costByDept: { name: string; value: number }[]; 
        comparisonData: {
            yearOverYear: { currentYearTotal: number; lastYearTotal: number };
            monthOverMonth: { currentMonthTotal: number; lastMonthTotal: number };
        };
    };
    otReport: { tableData: OtRow[]; kpis: Kpi[]; chartData: ChartDataPoint[]; };
    leaveReport: { tableData: LeaveRow[]; kpis: Kpi[]; chartData: ChartDataPoint[]; };
    accidentReport: { tableData: AccidentRow[]; kpis: Kpi[]; chartData: ChartDataPoint[]; };
    workloadReport: { data: WorkloadProductSection[]; };
    [key: string]: any; // Index signature
}

// Initial empty state for the application data
const initialAppData: AppData = {
    kpiReport: { kpis: [], tableRows: [] },
    consumablesReport: { 
        tableData: [], 
        kpis: [], 
        chartData: [], 
        topItems: [], 
        costByDept: [],
        comparisonData: {
            yearOverYear: { currentYearTotal: 0, lastYearTotal: 0 },
            monthOverMonth: { currentMonthTotal: 0, lastMonthTotal: 0 },
        }
    },
    otReport: { tableData: [], kpis: [], chartData: [] },
    leaveReport: { tableData: [], kpis: [], chartData: [] },
    accidentReport: { tableData: [], kpis: [], chartData: [] },
    workloadReport: { data: [] }
};

const App: React.FC = () => {
    const [activePage, setActivePage] = useState('kpiReport');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme as 'light' | 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [appData, setAppData] = useState<AppData>(initialAppData);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useTranslation();
    const [firestoreDocId, setFirestoreDocId] = useState<string | null>(null);

    // Theme effect
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Initial data load effect
    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await testFirebaseConnection();
            if (isFirebaseConnected()) {
                await handleLoadFromFirestore();
            } else {
                try {
                    const localDataString = localStorage.getItem(DB_STORAGE_KEY);
                    if (localDataString) {
                        const localData = JSON.parse(localDataString);
                        // Merge local data with initial state to ensure all keys exist
                        const mergedData: AppData = {
                            ...initialAppData,
                            kpiReport: { ...initialAppData.kpiReport, ...(localData.kpiReport || {}) },
                            consumablesReport: { ...initialAppData.consumablesReport, ...(localData.consumablesReport || {}) },
                            otReport: { ...initialAppData.otReport, ...(localData.otReport || {}) },
                            leaveReport: { ...initialAppData.leaveReport, ...(localData.leaveReport || {}) },
                            accidentReport: { ...initialAppData.accidentReport, ...(localData.accidentReport || {}) },
                            workloadReport: { ...initialAppData.workloadReport, ...(localData.workloadReport || {}) },
                        };
                        setAppData(mergedData);
                    }
                } catch (e) {
                    console.error("Failed to load data from localStorage", e);
                }
            }
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    const saveData = useCallback((data: AppData) => {
        setAppData(data);
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
        if (isFirebaseConnected()) {
            saveToFirestore('reports', data, firestoreDocId).then(id => {
                if (id && !firestoreDocId) setFirestoreDocId(id);
            });
        }
    }, [firestoreDocId]);

    const processFile = async (file: File): Promise<Partial<AppData>> => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    let processedData: Partial<AppData> = {};

                    switch (activePage) {
                        case 'kpiReport': {
                            const sheetName = workbook.SheetNames[0];
                            if (!sheetName) {
                                throw new Error("No sheets found in the Excel file.");
                            }
                            const worksheet = workbook.Sheets[sheetName];
                            // Use header: 1 to get an array of arrays, which is robust against header name changes
                            const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                            const rows = json.slice(1); // Skip header row
                            if (rows.length === 0) {
                                throw new Error("The KPI sheet has no data rows.");
                            }

                            const colors = ['text-brand-primary', 'text-brand-secondary', 'text-brand-success', 'text-brand-danger', 'text-brand-warning'];
                            const monthCols = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                            // First, create the detailed tableRows from the raw data using column indices
                            const tableRows: TableRow[] = rows.map((row): TableRow | null => {
                                // A valid row must have at least a title (column index 1)
                                if (!row || !row[1]) return null;
                                
                                const monthlyData: { [key: string]: string } = {};
                                monthCols.forEach((month, index) => {
                                    monthlyData[month] = String(row[4 + index] || '');
                                });

                                return {
                                    kpiNo: String(row[0] || ''),
                                    kpi: { title: String(row[1] || ''), measurement: String(row[3] || '') },
                                    target: String(row[2] || ''),
                                    score: String(row[16] || 'N/A'), // Access Score by index 16
                                    result: String(row[17] || 'N/A'),
                                    monthlyData,
                                    description: String(row[18] || ''),
                                    objective: String(row[19] || ''),
                                    measurementMethod: String(row[20] || ''),
                                    responsible: String(row[21] || ''),
                                    improvementPlan: String(row[22] || ''),
                                };
                            }).filter((r): r is TableRow => r !== null);

                            // Then, derive the summary KPIs from the processed tableRows for consistency
                            const kpis: Kpi[] = tableRows.map((row, index) => ({
                                title: row.kpi.title,
                                value: modifySpecificKpiScore(row.kpi.title, row.score), // Use the correct score from tableRows
                                target: row.target,
                                trend: row.result,
                                trendDirection: String(row.result).toUpperCase() === 'PASS' ? 'up' : 'down',
                                icon: getKpiIcon(row.kpi.title),
                                color: colors[index % colors.length],
                            }));

                            processedData.kpiReport = { kpis, tableRows };
                            break;
                        }
                        case 'consumablesReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                            if (sheetData.length < 2) throw new Error("Consumables sheet is empty or has no data rows.");
                            
                            const rows = sheetData.slice(1);

                            const tableData: ConsumableRow[] = rows.map(rowArray => {
                                if (!rowArray || rowArray.length === 0 || !rowArray[0]) return null;
                                let date = rowArray[0];
                                if (typeof date === 'number' && date > 0) {
                                    // Robust Excel date conversion (handles timezone and 1900 leap year bug)
                                    const jsDate = new Date((date - 25569) * 86400 * 1000);
                                    date = jsDate.toLocaleDateString('en-GB');
                                } else if (date instanceof Date) {
                                    date = date.toLocaleDateString('en-GB');
                                }
                                return {
                                    date: String(date || ''), material: String(rowArray[1] || ''), description: String(rowArray[2] || ''),
                                    quantity: String(rowArray[3] || '0'), unit: String(rowArray[4] || ''), price: String(rowArray[5] || '0'),
                                    totalPrice: String(rowArray[6] || '0'), costCenter: String(rowArray[7] || ''), department: String(rowArray[8] || ''),
                                };
                            }).filter((r): r is ConsumableRow => r !== null && r.date !== '');

                            const topItems = Object.values(tableData.reduce((acc, row) => {
                                const key = row.material || 'Unknown';
                                if (!acc[key]) acc[key] = { name: row.description || key, frequency: 0, totalCost: 0, material: key };
                                acc[key].frequency++;
                                acc[key].totalCost += parseValue(row.totalPrice) || 0;
                                return acc;
                            }, {} as { [key: string]: { name: string; frequency: number; totalCost: number; material: string } })).sort((a, b) => b.totalCost - a.totalCost).slice(0, 5);
                            
                            const costByDeptMap = tableData.reduce((acc, row) => {
                                const key = row.department || 'Unknown';
                                acc[key] = (acc[key] || 0) + (parseValue(row.totalPrice) || 0);
                                return acc;
                            }, {} as any);
                            const costByDept = Object.entries(costByDeptMap).map(([name, value]) => ({ name, value: value as number }));
                            
                            const monthlyTotals = Array(12).fill(0);
                            const today = new Date();
                            const currentYear = today.getFullYear();
                            const lastYear = currentYear - 1;
                            const currentMonth = today.getMonth();
                            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                            const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

                            let yearOverYear = { currentYearTotal: 0, lastYearTotal: 0 };
                            let monthOverMonth = { currentMonthTotal: 0, lastMonthTotal: 0 };
                            
                            const thisYearData = tableData.filter(r => r.date.endsWith(`/${currentYear}`));
                            const lastYearData = tableData.filter(r => r.date.endsWith(`/${lastYear}`));

                            thisYearData.forEach(row => {
                                const dateParts = row.date.split('/');
                                if (dateParts.length !== 3) return;
                                const month = parseInt(dateParts[1], 10) - 1;
                                const cost = parseValue(row.totalPrice) || 0;

                                if (month >= 0 && month < 12) monthlyTotals[month] += cost;
                                if (month === currentMonth) monthOverMonth.currentMonthTotal += cost;
                            });

                            tableData.forEach(row => {
                                const dateParts = row.date.split('/');
                                if (dateParts.length !== 3) return;
                                const month = parseInt(dateParts[1], 10) - 1;
                                const year = parseInt(dateParts[2], 10);
                                if (year === lastMonthYear && month === lastMonth) {
                                    monthOverMonth.lastMonthTotal += parseValue(row.totalPrice) || 0;
                                }
                            });
                            
                            const chartData = monthlyTotals.map((total, i) => ({ name: new Date(0, i).toLocaleString('en', { month: 'short' }), value: total }));
                            
                            // --- KPI Cards with YoY Comparison ---
                            const thisYearTotalCost = thisYearData.reduce((acc, row) => acc + (parseValue(row.totalPrice) || 0), 0);
                            const lastYearTotalCost = lastYearData.reduce((acc, row) => acc + (parseValue(row.totalPrice) || 0), 0);
                            const costDiff = thisYearTotalCost - lastYearTotalCost;
                            const costPctChange = lastYearTotalCost !== 0 ? (costDiff / lastYearTotalCost) * 100 : (thisYearTotalCost > 0 ? 100 : 0);

                            const thisYearTransactions = thisYearData.length;
                            const lastYearTransactions = lastYearData.length;
                            const transDiff = thisYearTransactions - lastYearTransactions;
                            const transPctChange = lastYearTransactions !== 0 ? (transDiff / lastYearTransactions) * 100 : (thisYearTransactions > 0 ? 100 : 0);

                            const thisYearUniqueItems = new Set(thisYearData.map(row => row.material)).size;
                            const lastYearUniqueItems = new Set(lastYearData.map(row => row.material)).size;
                            const itemsDiff = thisYearUniqueItems - lastYearUniqueItems;
                            const itemsPctChange = lastYearUniqueItems !== 0 ? (itemsDiff / lastYearUniqueItems) * 100 : (thisYearUniqueItems > 0 ? 100 : 0);

                            const thisYearUniqueDepts = new Set(thisYearData.map(row => row.department)).size;
                            const lastYearUniqueDepts = new Set(lastYearData.map(row => row.department)).size;
                            const deptsDiff = thisYearUniqueDepts - lastYearUniqueDepts;
                            const deptsPctChange = lastYearUniqueDepts !== 0 ? (deptsDiff / lastYearUniqueDepts) * 100 : (thisYearUniqueDepts > 0 ? 100 : 0);
                            
                            yearOverYear = { currentYearTotal: thisYearTotalCost, lastYearTotal: lastYearTotalCost };

                            const kpis: Kpi[] = [
                                {
                                    title: 'kpiTotalCost',
                                    value: `฿${thisYearTotalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`,
                                    icon: 'CurrencyDollarIcon', color: 'text-brand-success',
                                    trendDirection: costDiff > 0 ? 'down' : 'up', // Higher cost is bad
                                    comparison: {
                                        value: `฿${costDiff.toLocaleString('th-TH', { signDisplay: 'always', minimumFractionDigits: 2 })}`,
                                        percentage: `${costPctChange.toFixed(1)}%`,
                                        period: 'year'
                                    }
                                },
                                {
                                    title: 'kpiTransactions',
                                    value: thisYearTransactions.toLocaleString(),
                                    icon: 'DocumentTextIcon', color: 'text-brand-secondary',
                                    trendDirection: transDiff > 0 ? 'down' : 'up',
                                    comparison: {
                                        value: transDiff.toLocaleString('en-US', { signDisplay: 'always' }),
                                        percentage: `${transPctChange.toFixed(1)}%`,
                                        period: 'year'
                                    }
                                },
                                {
                                    title: 'kpiTotalItems',
                                    value: thisYearUniqueItems.toLocaleString(),
                                    icon: 'ArchiveBoxIcon', color: 'text-brand-primary',
                                    trendDirection: itemsDiff > 0 ? 'down' : 'up',
                                    comparison: {
                                        value: itemsDiff.toLocaleString('en-US', { signDisplay: 'always' }),
                                        percentage: `${itemsPctChange.toFixed(1)}%`,
                                        period: 'year'
                                    }
                                },
                                {
                                    title: 'kpiDepartments',
                                    value: thisYearUniqueDepts.toLocaleString(),
                                    icon: 'BuildingOfficeIcon', color: 'text-brand-warning',
                                    trendDirection: 'neutral',
                                    comparison: {
                                        value: deptsDiff.toLocaleString('en-US', { signDisplay: 'always' }),
                                        percentage: `${deptsPctChange.toFixed(1)}%`,
                                        period: 'year'
                                    }
                                },
                            ];
                            
                            processedData.consumablesReport = { tableData, kpis, chartData, topItems, costByDept, comparisonData: { yearOverYear, monthOverMonth } };
                            break;
                        }
                        case 'otReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                            if (sheetData.length < 2) throw new Error("OT Report sheet is empty.");

                            const tableData: OtRow[] = sheetData.slice(1).map(row => {
                                if (!row || row.length < 20) return null;
                                const monthlyOT = Array.from({ length: 12 }, (_, i) => parseValue(row[7 + i]) || 0);
                                return {
                                    id: String(row[0] || ''),
                                    employeeId: String(row[1] || ''),
                                    name: String(row[2] || ''),
                                    position: String(row[3] || ''),
                                    department: String(row[4] || ''),
                                    grade: String(row[5] || ''),
                                    status: String(row[6] || ''),
                                    monthlyOT: monthlyOT,
                                    totalOT: parseValue(row[19]) || 0,
                                };
                            }).filter((r): r is OtRow => r !== null && r.employeeId !== '');

                            const monthlyTotals = Array(12).fill(0);
                            const departmentTotals: { [key: string]: number } = {};
                            let totalOTAll = 0;
                            tableData.forEach(row => {
                                row.monthlyOT.forEach((ot, index) => { monthlyTotals[index] += ot; });
                                departmentTotals[row.department] = (departmentTotals[row.department] || 0) + row.totalOT;
                                totalOTAll += row.totalOT;
                            });

                            const chartData = monthlyTotals.map((total, i) => ({ name: new Date(0, i).toLocaleString('en', { month: 'short' }), value: total }));
                            const topDepartment = Object.entries(departmentTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
                            const topMonthIndex = monthlyTotals.indexOf(Math.max(...monthlyTotals));

                            const kpis: Kpi[] = [
                                { title: 'totalOtHours', value: totalOTAll.toLocaleString('en-US', { minimumFractionDigits: 2 }), icon: 'ClockIcon', color: 'text-brand-primary' },
                                { title: 'totalEmployeesOt', value: tableData.length.toLocaleString(), icon: 'UsersIcon', color: 'text-brand-secondary' },
                                { title: 'topDepartmentOt', value: topDepartment[0], icon: 'BuildingOfficeIcon', color: 'text-brand-warning' },
                                { title: 'topMonthOt', value: new Date(0, topMonthIndex).toLocaleString('en', { month: 'short' }), icon: 'ChartBarIcon', color: 'text-brand-success' }
                            ];

                            processedData.otReport = { tableData, kpis, chartData };
                            break;
                        }
                        case 'leaveReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                            if (sheetData.length < 2) throw new Error("Leave Report sheet is empty.");

                            const tableData: LeaveRow[] = sheetData.slice(1).map((row, index) => {
                                if (!row || row.length < 31) return null;
                                const monthlyLeave = Array.from({ length: 12 }, (_, i) => parseValue(row[7 + i]) || 0);
                                return {
                                    id: String(row[0] || index + 1), employeeId: String(row[1] || ''), name: String(row[2] || ''),
                                    position: String(row[3] || ''), department: String(row[4] || ''), grade: String(row[5] || ''),
                                    status: String(row[6] || ''), monthlyLeave: monthlyLeave,
                                    leaveWithoutVacation: parseValue(row[19]) || 0, totalLeaveWithVacation: parseValue(row[20]) || 0,
                                    vacationCarriedOver: parseValue(row[21]) || 0, vacationEntitlement: parseValue(row[22]) || 0,
                                    totalVacation: parseValue(row[23]) || 0, vacationUsed: parseValue(row[24]) || 0,
                                    vacationAccrued: parseValue(row[25]) || 0, sickLeave: parseValue(row[26]) || 0,
                                    personalLeave: parseValue(row[27]) || 0, birthdayLeave: parseValue(row[28]) || 0,
                                    otherLeave: parseValue(row[29]) || 0, totalLeave: parseValue(row[30]) || 0,
                                };
                            }).filter((r): r is LeaveRow => r !== null && r.employeeId !== '');

                            const monthlyTotals = Array(12).fill(0);
                            const departmentTotals: { [key: string]: number } = {};
                            const leaveTypeTotals = { 'Sick': 0, 'Personal': 0, 'Birthday': 0, 'Other': 0, 'Vacation': 0 };
                            let totalLeaveAll = 0;

                            tableData.forEach(row => {
                                row.monthlyLeave.forEach((leave, index) => { monthlyTotals[index] += leave; });
                                departmentTotals[row.department] = (departmentTotals[row.department] || 0) + row.totalLeave;
                                leaveTypeTotals['Sick'] += row.sickLeave;
                                leaveTypeTotals['Personal'] += row.personalLeave;
                                leaveTypeTotals['Birthday'] += row.birthdayLeave;
                                leaveTypeTotals['Other'] += row.otherLeave;
                                leaveTypeTotals['Vacation'] += row.vacationUsed;
                                totalLeaveAll += row.totalLeave;
                            });

                            const chartData = monthlyTotals.map((total, i) => ({ name: new Date(0, i).toLocaleString('en', { month: 'short' }), value: total }));
                            const topDepartment = Object.entries(departmentTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
                            const topLeaveType = Object.entries(leaveTypeTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];
                            const topMonthIndex = monthlyTotals.indexOf(Math.max(...monthlyTotals));

                            const kpis: Kpi[] = [
                                { title: 'totalLeaveDays', value: totalLeaveAll.toLocaleString('en-US', { minimumFractionDigits: 2 }), icon: 'CalendarDaysIcon', color: 'text-brand-primary' },
                                { title: 'topLeaveType', value: topLeaveType[0], icon: 'ClipboardDocumentCheckIcon', color: 'text-brand-secondary' },
                                { title: 'topDepartmentLeave', value: topDepartment[0], icon: 'BuildingOfficeIcon', color: 'text-brand-warning' },
                                { title: 'topMonthLeave', value: new Date(0, topMonthIndex).toLocaleString('en', { month: 'short' }), icon: 'ChartBarIcon', color: 'text-brand-success' }
                            ];

                            processedData.leaveReport = { tableData, kpis, chartData };
                            break;
                        }
                        case 'accidentReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                            if (sheetData.length < 2) throw new Error("Accident Report sheet is empty.");

                            const tableData: AccidentRow[] = sheetData.slice(1).map(row => {
                                if (!row || row.length < 18) return null;
                                let incidentDate = row[1];
                                if (typeof incidentDate === 'number' && incidentDate > 0) {
                                    incidentDate = new Date(1899, 11, 30 + incidentDate).toLocaleDateString('en-GB');
                                } else if (incidentDate instanceof Date) {
                                    incidentDate = incidentDate.toLocaleDateString('en-GB');
                                }
                                return {
                                    id: String(row[0] || ''), incidentDate: String(incidentDate || ''), incidentTime: String(row[2] || ''),
                                    severity: String(row[3] || ''), occurrence: String(row[4] || ''), department: String(row[5] || ''),
                                    employeeId: String(row[6] || ''), employeeName: String(row[7] || ''), position: String(row[8] || ''),
                                    details: String(row[9] || ''), cause: String(row[10] || ''), prevention: String(row[11] || ''),
                                    damageValue: parseValue(row[12]) || 0, insuranceClaim: String(row[13] || ''),
                                    actionTaken: String(row[14] || ''), penalty: String(row[15] || ''),
                                    remarks: String(row[16] || ''), accidentLocation: String(row[17] || ''),
                                };
                            }).filter((r): r is AccidentRow => r !== null && r.id !== '');

                            const departmentTotals: { [key: string]: number } = {};
                            const severityTotals: { [key: string]: number } = {};
                            let totalDamage = 0;
                            tableData.forEach(row => {
                                if (row.department) departmentTotals[row.department] = (departmentTotals[row.department] || 0) + 1;
                                if (row.severity) severityTotals[row.severity] = (severityTotals[row.severity] || 0) + 1;
                                totalDamage += row.damageValue;
                            });

                            const chartData = Object.entries(departmentTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
                            const topDepartment = chartData[0] || { name: 'N/A', value: 0 };
                            const topSeverity = Object.entries(severityTotals).sort((a, b) => b[1] - a[1])[0] || ['N/A', 0];

                            const kpis: Kpi[] = [
                                { title: 'totalIncidents', value: tableData.length.toLocaleString(), icon: 'ExclamationTriangleIcon', color: 'text-brand-danger' },
                                { title: 'totalDamage', value: `฿${totalDamage.toLocaleString('th-TH')}`, icon: 'CurrencyDollarIcon', color: 'text-brand-warning' },
                                { title: 'topDepartmentAccident', value: topDepartment.name, icon: 'BuildingOfficeIcon', color: 'text-brand-primary' },
                                { title: 'topSeverity', value: topSeverity[0], icon: 'ClipboardDocumentCheckIcon', color: 'text-brand-secondary' }
                            ];

                            processedData.accidentReport = { tableData, kpis, chartData };
                            break;
                        }

                        case 'workloadReport': {
                            const sheetName = workbook.SheetNames[0];
                            const worksheet = workbook.Sheets[sheetName];
                            const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
                            if (sheetData.length < 2) throw new Error("Workload Report sheet is empty.");

                            const data: WorkloadProductSection[] = [];
                            let currentProductSection: WorkloadProductSection | null = null;
                            sheetData.slice(1).forEach(row => {
                                if (!row || row.every(cell => cell === null)) return;
                                const productCell = row[0];
                                const descriptionCell = row[1];
                                if (productCell && typeof productCell === 'string' && productCell.trim() !== '') {
                                    if (currentProductSection) data.push(currentProductSection);
                                    currentProductSection = {
                                        product: productCell.trim(),
                                        isSubProduct: productCell.trim() === 'Ton/Person/Hr.',
                                        rows: []
                                    };
                                }
                                if (descriptionCell && typeof descriptionCell === 'string' && descriptionCell.trim() !== '' && currentProductSection) {
                                    const description = descriptionCell.trim();
                                    const values = row.slice(3, 15).map(v => parseValue(v));
                                    const nonSubRowPrefixes = ['Sum', 'Manpower', 'Workday', 'Working Hours', 'OT'];
                                    currentProductSection.rows.push({
                                        description,
                                        isSubRow: !nonSubRowPrefixes.some(prefix => description.startsWith(prefix)),
                                        unit: row[2] || '',
                                        values,
                                        average: parseValue(row[16]),
                                        min: parseValue(row[17]),
                                        max: parseValue(row[18])
                                    });
                                }
                            });
                            if (currentProductSection) data.push(currentProductSection);

                            processedData.workloadReport = { data };
                            break;
                        }
                        default:
                            throw new Error(`No parser available for ${activePage}`);
                    }
                    resolve(processedData);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const parsedData = await processFile(file);
            saveData({ ...appData, ...parsedData });
            Swal.fire({ icon: 'success', title: 'Success!', text: 'File processed and data updated.' });
        } catch (e: any) {
            setError(`Error processing file: ${e.message}`);
            Swal.fire({ icon: 'error', title: 'Oops...', text: `Error processing file: ${e.message}` });
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [activePage, appData, saveData]);

    const handleLoadFromFirestore = async () => {
        if (!isFirebaseConnected()) {
            setError("Firebase not connected.");
            Swal.fire({ icon: 'error', title: 'Connection Error', text: 'Not connected to the database.' });
            return;
        }
        setIsLoading(true);
        try {
            const data = await getFromFirestore<any>('reports');
            if (data.length > 0) {
                const latestReport = data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
                const { id, ...reportData } = latestReport;
                setFirestoreDocId(id);
                const mergedData: AppData = {
                    ...initialAppData,
                    kpiReport: { ...initialAppData.kpiReport, ...(reportData.kpiReport || {}) },
                    consumablesReport: { ...initialAppData.consumablesReport, ...(reportData.consumablesReport || {}) },
                    otReport: { ...initialAppData.otReport, ...(reportData.otReport || {}) },
                    leaveReport: { ...initialAppData.leaveReport, ...(reportData.leaveReport || {}) },
                    accidentReport: { ...initialAppData.accidentReport, ...(reportData.accidentReport || {}) },
                    workloadReport: { ...initialAppData.workloadReport, ...(reportData.workloadReport || {}) },
                };
                saveData(mergedData);
                Swal.fire({ icon: 'success', title: 'Data Loaded', text: 'Latest data loaded from the cloud.' });
            } else {
                Swal.fire({ icon: 'info', title: 'No Data', text: 'No data found in the cloud.' });
            }
        } catch (e) {
            setError("Failed to load data from Cloud.");
            Swal.fire({ icon: 'error', title: 'Load Failed', text: 'Could not retrieve data from the cloud.' });
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearData = () => {
        const pageConfig: { [key: string]: { name: string; dataKey: keyof AppData } } = {
            kpiReport: { name: t('kpiReport'), dataKey: 'kpiReport' },
            consumablesReport: { name: t('consumablesReport'), dataKey: 'consumablesReport' },
            otReport: { name: t('otReport'), dataKey: 'otReport' },
            leaveReport: { name: t('leaveReport'), dataKey: 'leaveReport' },
            accidentReport: { name: t('accidentReport'), dataKey: 'accidentReport' },
            workloadReport: { name: t('workloadReport'), dataKey: 'workloadReport' },
        };
        
        const config = pageConfig[activePage];
        if (!config) {
            Swal.fire('Error', 'Cannot clear data for this page.', 'error');
            return;
        }

        Swal.fire({
            title: `Delete ${config.name} Data?`,
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result: any) => {
            if (result.isConfirmed) {
                const newAppData = {
                    ...appData,
                    [config.dataKey]: initialAppData[config.dataKey],
                };
                saveData(newAppData);
                Swal.fire('Deleted!', `${config.name} data has been cleared.`, 'success');
            }
        });
    };
    
    const handleNavigate = (page: string) => {
        setActivePage(page);
        setIsSidebarOpen(false);
    };

    const renderActivePage = () => {
        if (isLoading) return <LoadingSpinner />;
        if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

        switch (activePage) {
            case 'kpiReport':
                return <KpiReport kpis={appData.kpiReport.kpis} tableRows={appData.kpiReport.tableRows} theme={theme} />;
            case 'consumablesReport':
                return <ConsumablesReport {...appData.consumablesReport} theme={theme} />;
            case 'otReport':
                return <OTReport {...appData.otReport} theme={theme} />;
            case 'leaveReport':
                return <LeaveReport {...appData.leaveReport} theme={theme} />;
            case 'accidentReport':
                return <AccidentReport {...appData.accidentReport} theme={theme} />;
            case 'workloadReport':
                return <WorkloadReport data={appData.workloadReport.data} theme={theme} />;
            case 'comparisonReport':
            case 'reports':
            case 'documents':
            case 'settings':
            case 'helpCenter':
                return <PlaceholderPage title={t(activePage as any)} />;
            default:
                return <PlaceholderPage title="Dashboard" />;
        }
    };

    return (
        <div className={`flex h-screen bg-light-bg dark:bg-dark-bg text-light-text-primary dark:text-dark-text-primary font-sans transition-colors duration-300`}>
            <Sidebar activePage={activePage} onNavigate={handleNavigate} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    onFileUpload={handleFileUpload}
                    activePage={activePage}
                    theme={theme}
                    toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                    onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    onLoadFromFirestore={handleLoadFromFirestore}
                    onClearData={handleClearData}
                />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderActivePage()}
                </main>
            </div>
        </div>
    );
};

export default App;
