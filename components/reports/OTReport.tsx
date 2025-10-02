import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ChartDataPoint, OtRow } from '../../types';
import KPICard from '../KPICard';
import MainChart from '../MainChart';
import { DocumentTextIcon, MagnifyingGlassIcon, ChevronDownIcon } from '../icons';

interface OTReportProps {
    tableData: OtRow[];
    kpis: Kpi[];
    chartData: ChartDataPoint[];
    theme: 'light' | 'dark';
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-xs font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{label}</span>
        <span className="text-light-text-primary dark:text-dark-text-primary mt-1">{value || '-'}</span>
    </div>
);

const OTReport: React.FC<OTReportProps> = ({ tableData, kpis, chartData, theme }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const handleRowToggle = (rowId: string) => {
        setExpandedRowId(prevId => (prevId === rowId ? null : rowId));
    };
    
    const monthNames = useMemo(() => [
        t('monthJan'), t('monthFeb'), t('monthMar'), t('monthApr'), t('monthMay'), t('monthJun'),
        t('monthJul'), t('monthAug'), t('monthSep'), t('monthOct'), t('monthNov'), t('monthDec')
    ], [t]);
    
    const headers = useMemo(() => [
        t('headerName'), t('headerPosition'), t('headerDepartment'), t('headerTotal')
    ], [t]);

    const filteredData = useMemo(() => tableData.filter(row => {
        const searchString = searchTerm.toLowerCase();
        return (
            row.id.toLowerCase().includes(searchString) ||
            row.employeeId.toLowerCase().includes(searchString) ||
            row.name.toLowerCase().includes(searchString) ||
            row.position.toLowerCase().includes(searchString) ||
            row.department.toLowerCase().includes(searchString) ||
            row.grade.toLowerCase().includes(searchString) ||
            row.status.toLowerCase().includes(searchString) ||
            String(row.totalOT).toLowerCase().includes(searchString)
        );
    }), [tableData, searchTerm]);

    const groupedByDepartment = useMemo(() => {
        const groups: { [key: string]: { rows: OtRow[], subtotal: number } } = {};
        filteredData.forEach(row => {
            const key = row.department && row.department.trim() !== '' ? row.department : 'OTHER';
            if (!groups[key]) {
                groups[key] = { rows: [], subtotal: 0 };
            }
            groups[key].rows.push(row);
            groups[key].subtotal += row.totalOT;
        });
        return Object.entries(groups).sort((a, b) => String(a[0]).localeCompare(String(b[0])));
    }, [filteredData]);

    const topEmployees = useMemo(() => {
        if (!tableData) return [];
        return [...tableData]
            .sort((a, b) => b.totalOT - a.totalOT)
            .slice(0, 10);
    }, [tableData]);

    const topDepartments = useMemo(() => {
        if (!tableData) return [];
        const departmentTotals: { [key: string]: number } = {};
        tableData.forEach(row => {
            if (row.department) {
                departmentTotals[row.department] = (departmentTotals[row.department] || 0) + row.totalOT;
            }
        });
        return Object.entries(departmentTotals)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }, [tableData]);

    if (tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageOT')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => <KPICard key={index} {...kpi} title={t(kpi.title as any)} />)}
            </div>
            <MainChart data={chartData} title={t('monthlyOvertimeHours')} theme={theme} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Top Employees Table */}
                 <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                    <div className="p-6 border-b border-light-border dark:border-dark-border">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('top10EmployeesByOT')}</h3>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                                <tr className="border-b border-light-border dark:border-dark-border">
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">#</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('name')}</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('department')}</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('totalHours')}</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                                {topEmployees.map((employee, index) => (
                                    <tr key={employee.employeeId} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary font-medium">{index + 1}</td>
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary max-w-xs truncate" title={employee.name}>{employee.name}</td>
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{employee.department}</td>
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">{employee.totalOT.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Departments Table */}
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                    <div className="p-6 border-b border-light-border dark:border-dark-border">
                        <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('top10DepartmentsByOT')}</h3>
                    </div>
                    <div className="overflow-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                                <tr className="border-b border-light-border dark:border-dark-border">
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">#</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('department')}</th>
                                    <th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('totalHours')}</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                                {topDepartments.map((dept, index) => (
                                    <tr key={dept.name} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors">
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary font-medium">{index + 1}</td>
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{dept.name}</td>
                                        <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">{dept.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('employeeOTDetails')}</h3>
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                            type="text"
                            placeholder={t('searchEmployees')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 text-light-text-primary dark:text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left min-w-[1024px]">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="p-4 w-12" aria-label="Expand row"></th>
                                {headers.map(header => (
                                    <th key={header} className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase whitespace-nowrap">{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                            {groupedByDepartment.map(([dept, group]) => (
                                <React.Fragment key={dept}>
                                    <tr className="bg-slate-50/60 dark:bg-dark-bg/50">
                                        <td colSpan={headers.length + 1} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-light-text-primary dark:text-dark-text-primary">{t('departmentLabel')}: {dept}</span>
                                                <span className="text-sm font-semibold text-brand-primary">{group.subtotal.toFixed(2)}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {group.rows.map((row) => {
                                        const isExpanded = expandedRowId === row.id;
                                        return (
                                        <React.Fragment key={row.id}>
                                            <tr onClick={() => handleRowToggle(row.id)} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer">
                                                <td className="p-4">
                                                    <ChevronDownIcon 
                                                        className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isExpanded ? 'rotate-180' : ''}`} 
                                                    />
                                                </td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.name}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.position}</td>
                                                <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary whitespace-nowrap">{row.department}</td>
                                                <td className="p-4 text-sm font-bold text-brand-primary whitespace-nowrap text-right">{row.totalOT.toFixed(2)}</td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-200/50 dark:bg-dark-bg/50">
                                                    <td colSpan={headers.length + 1} className="p-0">
                                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 bg-light-bg dark:bg-dark-bg/50 p-6">
                                                            <div className="space-y-3">
                                                                <DetailItem label={t('headerId')} value={row.id} />
                                                                <DetailItem label={t('headerEmployeeId')} value={row.employeeId} />
                                                            </div>
                                                            <div className="space-y-3">
                                                                <DetailItem label={t('headerGrade')} value={row.grade} />
                                                                <DetailItem label={t('headerStatus')} value={row.status} />
                                                            </div>
                                                            <div className="col-span-full lg:col-span-1">
                                                                <h4 className="font-semibold mb-3 text-light-text-primary dark:text-dark-text-primary">{t('monthlyOvertimeHours')}</h4>
                                                                <div className="grid grid-cols-4 gap-3">
                                                                    {row.monthlyOT.map((ot, index) => (
                                                                        <DetailItem key={index} label={monthNames[index]} value={ot.toFixed(2)} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )})}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OTReport;