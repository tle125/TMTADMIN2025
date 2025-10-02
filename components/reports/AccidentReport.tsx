import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ChartDataPoint, AccidentRow } from '../../types';
import KPICard from '../KPICard';
import MainChart from '../MainChart';
import { DocumentTextIcon, MagnifyingGlassIcon, ExclamationTriangleIcon, ChevronDownIcon } from '../icons';

interface AccidentReportProps {
    tableData: AccidentRow[];
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

const AccidentReport: React.FC<AccidentReportProps> = ({ tableData, kpis, chartData, theme }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const handleRowToggle = (rowId: string) => {
        setExpandedRowId(prevId => (prevId === rowId ? null : rowId));
    };
    
    const headers = useMemo(() => [
        t('headerSeq'), t('headerIncidentDate'), t('headerSeverity'),
        t('headerNameSurname'), t('headerDetails')
    ], [t]);
    
    const filteredData = useMemo(() => tableData.filter(row =>
        Object.values(row).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
    ), [tableData, searchTerm]);

    const severityCounts = useMemo(() => {
        return tableData.reduce((acc, row) => {
            const severity = row.severity || 'Unknown';
            acc[severity] = (acc[severity] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });
    }, [tableData]);

    const severityColors: { [key: string]: string } = {
        'L': 'bg-red-500/20 text-red-400',
        'M': 'bg-amber-500/20 text-amber-400',
        'S': 'bg-yellow-500/20 text-yellow-400',
        'Unknown': 'bg-slate-500/20 text-slate-400',
    };

    const SeverityCard = () => {
        const severityOrder = ['S', 'M', 'L'];
        
        const sortedSeverities = Object.entries(severityCounts).sort(([a], [b]) => {
            const indexA = severityOrder.indexOf(a);
            const indexB = severityOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });

        return (
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6 flex flex-col gap-4 min-h-[220px]">
                <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary">{t('severityBreakdown')}</h3>
                    <ExclamationTriangleIcon className="h-8 w-8 text-brand-danger flex-shrink-0" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4 content-start">
                     {sortedSeverities.length > 0 ? (
                        sortedSeverities.map(([severity, count]) => (
                            <div key={severity} className="flex flex-col items-center justify-center bg-light-bg dark:bg-dark-bg p-3 rounded-lg">
                                <span className={`px-3 py-1 text-sm font-bold rounded-full ${severityColors[severity] || severityColors['Unknown']}`}>
                                    {severity}
                                </span>
                                <span className="mt-2 text-2xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                    {count}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 text-center text-light-text-secondary dark:text-dark-text-secondary py-4">{t('noSeverityData')}</div>
                    )}
                </div>
            </div>
        );
    };

    if (tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageAccident')}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {kpis.map((kpi, index) => <KPICard key={index} {...kpi} title={t(kpi.title as any)} />)}
                <SeverityCard />
            </div>
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-6">
                <MainChart data={chartData} title={t('accidentsByDepartment')} theme={theme} />
            </div>
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('accidentDetails')}</h3>
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                        <input
                            type="text"
                            placeholder={t('searchAccidents')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 w-full sm:w-64"
                        />
                    </div>
                </div>
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="p-4 w-12" aria-label="Expand row"></th>
                                {headers.map(header => <th key={header} className="p-4 text-sm font-semibold whitespace-nowrap">{header}</th>)}
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                            {filteredData.map((row) => (
                                <React.Fragment key={row.id}>
                                    <tr 
                                        className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 cursor-pointer"
                                        onClick={() => handleRowToggle(row.id)}
                                    >
                                        <td className="p-4">
                                            <ChevronDownIcon 
                                                className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${expandedRowId === row.id ? 'rotate-180' : ''}`} 
                                            />
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap">{row.id}</td>
                                        <td className="p-4 text-sm whitespace-nowrap">{row.incidentDate}</td>
                                        <td className="p-4 text-sm whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${severityColors[row.severity] || severityColors['Unknown']}`}>
                                                {row.severity}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm whitespace-nowrap max-w-xs truncate" title={row.employeeName}>{row.employeeName}</td>
                                        <td className="p-4 text-sm whitespace-normal max-w-lg">{row.details}</td>
                                    </tr>
                                    {expandedRowId === row.id && (
                                        <tr className="bg-slate-200/50 dark:bg-dark-bg/50">
                                            <td colSpan={headers.length + 1} className="p-0">
                                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-6 bg-light-bg dark:bg-dark-bg/50 p-6">
                                                    <DetailItem label={t('headerIncidentTime')} value={row.incidentTime} />
                                                    <DetailItem label={t('headerOccurrence')} value={row.occurrence} />
                                                    <DetailItem label={t('headerWorkSection')} value={row.department} />
                                                    <DetailItem label={t('headerEmployeeId')} value={row.employeeId} />
                                                    <DetailItem label={t('headerPosition')} value={row.position} />
                                                    <DetailItem label={t('headerDamageValue')} value={`฿ ${row.damageValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                                    <DetailItem label={t('headerInsuranceClaim')} value={row.insuranceClaim} />
                                                    <DetailItem label={t('headerPenalty')} value={row.penalty} />
                                                    <DetailItem label={t('headerLocation')} value={row.accidentLocation} />
                                                    <DetailItem label={t('headerRemarks')} value={row.remarks} />
                                                    <div className="col-span-full sm:col-span-2 lg:col-span-2">
                                                        <DetailItem label={t('headerCause')} value={<p className="whitespace-normal">{row.cause}</p>} />
                                                    </div>
                                                    <div className="col-span-full sm:col-span-2 lg:col-span-2">
                                                        <DetailItem label={t('headerPrevention')} value={<p className="whitespace-normal">{row.prevention}</p>} />
                                                    </div>
                                                    <div className="col-span-full sm:col-span-2 lg:col-span-2">
                                                        <DetailItem label={t('headerActionTaken')} value={<p className="whitespace-normal">{row.actionTaken}</p>} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccidentReport;