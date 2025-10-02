import React, { useMemo } from 'react';
import { useTranslation } from '../../context/LanguageProvider';
import { WorkloadProductSection } from '../../types';
import KPICard from '../KPICard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DocumentTextIcon } from '../icons';

interface WorkloadReportProps {
    data: WorkloadProductSection[];
    theme: 'light' | 'dark';
}

const WorkloadReport: React.FC<WorkloadReportProps> = ({ data, theme }) => {
    const { t } = useTranslation();

    const monthNames = useMemo(() => [
        t('monthJan'), t('monthFeb'), t('monthMar'), t('monthApr'), t('monthMay'), t('monthJun'),
        t('monthJul'), t('monthAug'), t('monthSep'), t('monthOct'), t('monthNov'), t('monthDec')
    ], [t]);

    const { summaryKpis, chartData } = useMemo(() => {
        if (!data || data.length === 0) {
            return { summaryKpis: [], chartData: [] };
        }

        const getTonPerHrSumForProduct = (productName: string) => {
            const productIndex = data.findIndex(p => p.product === productName);
            if (productIndex === -1 || !data[productIndex + 1]) return [];
            const tonHrSection = data[productIndex + 1];
            if (tonHrSection && tonHrSection.product === 'Ton/Person/Hr.' && tonHrSection.isSubProduct) {
                const sumRow = tonHrSection.rows.find(r => r.description === 'Sum');
                return sumRow ? sumRow.values : [];
            }
            return [];
        };

        const rawMaterialTonHr = getTonPerHrSumForProduct('Raw Material');
        const coilTonHr = getTonPerHrSumForProduct('Coil');
        const filmTonHr = getTonPerHrSumForProduct('Film&Scrap');

        const avg = (arr: (number|null)[]) => {
            if (!arr) return 0;
            const filtered = arr.filter((v): v is number => v !== null);
            if(filtered.length === 0) return 0;
            return filtered.reduce((a, b) => a + b, 0) / filtered.length;
        };
        
        const _summaryKpis = [
            { title: t('avgWorkloadRaw'), value: avg(rawMaterialTonHr).toFixed(2), icon: 'UserGroupIcon', color: 'text-brand-success' },
            { title: t('avgWorkloadCoil'), value: avg(coilTonHr).toFixed(2), icon: 'UserGroupIcon', color: 'text-brand-primary' },
            { title: t('avgWorkloadFilm'), value: avg(filmTonHr).toFixed(2), icon: 'UserGroupIcon', color: 'text-brand-warning' },
        ];

        const _chartData = monthNames.map((month, index) => ({
            month,
            [t('chartRawMaterial')]: rawMaterialTonHr[index] || 0,
            [t('chartCoil')]: coilTonHr[index] || 0,
            [t('chartFilmScrap')]: filmTonHr[index] || 0,
        }));

        return { summaryKpis: _summaryKpis, chartData: _chartData };
    }, [data, t, monthNames]);
    
    if (!data || data.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageWorkload')}</p>
                </div>
            </div>
        );
    }
    
    const gridColor = theme === 'dark' ? '#334155' : '#E2E8F0';
    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    const formatNumber = (num: number | null | undefined) => {
        if (num === null || num === undefined) return '-';
        return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summaryKpis.map((kpi, index) => (
                    <KPICard
                        key={index}
                        title={kpi.title}
                        value={kpi.value}
                        icon={kpi.icon}
                        color={kpi.color}
                    />
                ))}
            </div>
             <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 h-[480px] shadow-lg">
                <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('workloadByProduct')}</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor}/>
                        <XAxis dataKey="month" stroke={tickColor} tick={{ fill: tickColor }} />
                        <YAxis stroke={tickColor} tick={{ fill: tickColor }}/>
                        <Tooltip contentStyle={{
                            backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
                            borderColor: theme === 'dark' ? '#334155' : '#E2E8F0',
                        }}/>
                        <Legend wrapperStyle={{ color: tickColor }} />
                        <Line type="monotone" dataKey={t('chartRawMaterial')} stroke="#10B981" strokeWidth={2} />
                        <Line type="monotone" dataKey={t('chartCoil')} stroke="#6366F1" strokeWidth={2} />
                        <Line type="monotone" dataKey={t('chartFilmScrap')} stroke="#F59E0B" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                 <div className="p-6 border-b border-light-border dark:border-dark-border">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('workloadDetails')}</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1600px]">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                <th className="p-4 text-sm font-semibold uppercase w-1/5">{t('product')}</th>
                                <th className="p-4 text-sm font-semibold uppercase w-1/4">{t('description')}</th>
                                <th className="p-4 text-sm font-semibold uppercase w-[80px]">{t('unit')}</th>
                                {monthNames.map(m => <th key={m} className="p-4 text-sm font-semibold uppercase text-right">{m}</th>)}
                                <th className="p-4 text-sm font-semibold uppercase text-right">{t('headerAverage')}</th>
                                <th className="p-4 text-sm font-semibold uppercase text-right">{t('headerMin')}</th>
                                <th className="p-4 text-sm font-semibold uppercase text-right">{t('headerMax')}</th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-light-border dark:divide-dark-border'>
                           {data.map((productSection, sectionIndex) => (
                                <React.Fragment key={sectionIndex}>
                                    {!productSection.isSubProduct && (
                                        <tr className="bg-slate-50 dark:bg-dark-bg/50">
                                            <td colSpan={18} className="p-4 font-bold text-lg text-brand-primary">
                                                {productSection.product}
                                            </td>
                                        </tr>
                                    )}
                                    {productSection.rows.map((row, rowIndex) => (
                                        <tr key={`${sectionIndex}-${rowIndex}`} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50">
                                             <td>
                                                {productSection.isSubProduct && rowIndex === 0 &&
                                                    <div className="p-4 font-bold">{productSection.product}</div>
                                                }
                                            </td>
                                            <td className={`p-4 text-sm ${row.isSubRow ? 'pl-8' : 'font-semibold'}`}>{row.description}</td>
                                            <td className="p-4 text-sm">{row.unit}</td>
                                            {row.values.map((val, i) => <td key={i} className="p-4 text-sm text-right whitespace-nowrap">{formatNumber(val)}</td>)}
                                            <td className="p-4 text-sm text-right whitespace-nowrap font-medium">{formatNumber(row.average)}</td>
                                            <td className="p-4 text-sm text-right whitespace-nowrap font-medium">{formatNumber(row.min)}</td>
                                            <td className="p-4 text-sm text-right whitespace-nowrap font-medium">{formatNumber(row.max)}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkloadReport;