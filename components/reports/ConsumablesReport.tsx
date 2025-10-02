import React, { useMemo, useState, useRef, useEffect } from 'react';
// FIX: Import 'ResponsiveContainer' and 'Tooltip' from 'recharts' to resolve 'Cannot find name' errors.
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTranslation } from '../../context/LanguageProvider';
import { Kpi, ChartDataPoint, ConsumableRow } from '../../types';
import KPICard from '../KPICard';
import MainChart from '../MainChart';
import { DocumentTextIcon, MagnifyingGlassIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChevronDownIcon, XMarkIcon } from '../icons';
import { parseValue } from '../../constants';

interface ComparisonData {
    yearOverYear: { currentYearTotal: number; lastYearTotal: number };
    monthOverMonth: { currentMonthTotal: number; lastMonthTotal: number };
}

interface ConsumablesReportProps {
    tableData: ConsumableRow[];
    kpis: Kpi[];
    chartData: ChartDataPoint[];
    topItems: { name: string; frequency: number; totalCost: number; material: string; }[];
    costByDept: { name: string; value: number }[];
    comparisonData: ComparisonData;
    theme: 'light' | 'dark';
}

const ComparisonStatCard: React.FC<{
    title: string;
    currentValue: number;
    previousValue: number;
    formatter: (value: number) => string;
}> = ({ title, currentValue, previousValue, formatter }) => {
    const diff = currentValue - previousValue;
    const pctChange = previousValue !== 0 ? (diff / previousValue) * 100 : (currentValue > 0 ? 100 : 0);
    
    // For cost, an increase is bad (red), a decrease is good (green)
    const isIncrease = diff > 0;
    
    const trendColor = isIncrease ? 'text-brand-danger' : 'text-brand-success';
    const bgColor = isIncrease ? 'bg-red-500/10' : 'bg-green-500/10';
    const TrendIcon = isIncrease ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

    return (
        <div className="bg-light-bg dark:bg-dark-bg rounded-lg p-6 flex flex-col gap-3">
            <h4 className="text-md font-semibold text-light-text-secondary dark:text-dark-text-secondary">{title}</h4>
            <p className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary">{formatter(currentValue)}</p>
            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${bgColor} ${trendColor} px-2 py-1 rounded-full text-sm font-semibold`}>
                    <TrendIcon className="h-4 w-4" />
                    <span>{pctChange.toFixed(1)}%</span>
                </div>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                    vs {formatter(previousValue)}
                </span>
            </div>
        </div>
    );
};


const ConsumablesReport: React.FC<ConsumablesReportProps> = ({ tableData, kpis, chartData, topItems, costByDept, comparisonData, theme }) => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [componentOrder, setComponentOrder] = useState<string[]>([]);
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
    const [selectedTopItem, setSelectedTopItem] = useState<{ name: string; material: string } | null>(null);
    const [topItemDetails, setTopItemDetails] = useState<{ department: string; totalCost: number }[]>([]);

    useEffect(() => {
        const initialKpiIds = kpis.map((_, index) => `kpi-${index}`);
        const initialWidgetIds = ['monthlyCost', 'comparison', 'costByDept', 'topItems'];
        
        const currentKpiIds = componentOrder.filter(id => id.startsWith('kpi-'));
        if (componentOrder.length === 0 || currentKpiIds.length !== kpis.length) {
          setComponentOrder([...initialKpiIds, ...initialWidgetIds]);
        }
    }, [kpis, componentOrder]);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
        dragItem.current = index;
        e.currentTarget.classList.add('opacity-50', 'border-2', 'border-dashed', 'border-brand-primary');
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDrop = () => {
        if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
            const newOrder = [...componentOrder];
            const dragItemContent = newOrder.splice(dragItem.current, 1)[0];
            if (dragItemContent) {
                newOrder.splice(dragOverItem.current, 0, dragItemContent);
            }
            dragItem.current = null;
            dragOverItem.current = null;
            setComponentOrder(newOrder);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('opacity-50', 'border-2', 'border-dashed', 'border-brand-primary');
    };

    const handleTopItemClick = (item: { name: string; material: string }) => {
        const detailsByDept: { [key: string]: number } = {};
        
        tableData
            .filter(row => row.material === item.material)
            .forEach(row => {
                const dept = row.department || 'Unknown';
                detailsByDept[dept] = (detailsByDept[dept] || 0) + (parseValue(row.totalPrice) || 0);
            });
            
        const sortedDetails = Object.entries(detailsByDept)
            .map(([department, totalCost]) => ({ department, totalCost }))
            .sort((a, b) => b.totalCost - a.totalCost);

        setTopItemDetails(sortedDetails);
        setSelectedTopItem(item);
    };

    const headers = useMemo(() => [
        t('headerDate'), t('headerMaterial'), t('headerDescription'), t('headerQuantity'), t('headerUnit'), 
        t('headerPrice'), t('headerTotalPrice'), t('headerCostCenter'), t('headerDepartment')
    ], [t]);
    
    const numericHeaders = useMemo(() => [t('headerQuantity'), t('headerPrice'), t('headerTotalPrice')], [t]);

    const formatMonthForDisplay = (monthKey: string) => {
        const [year, month] = monthKey.split('-');
        const date = new Date(Number(year), Number(month) - 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };
    
    const groupedData = useMemo(() => {
        let data = tableData;
        
        if (searchTerm) {
            const lowercasedSearch = searchTerm.toLowerCase();
            data = data.filter(row =>
                Object.values(row).some(value =>
                    String(value).toLowerCase().includes(lowercasedSearch)
                )
            );
        }

        const groups: { [key: string]: { rows: ConsumableRow[], totalCost: number, totalItems: number } } = {};

        data.forEach(row => {
            const parts = row.date.split('/');
            if (parts.length === 3) {
                const year = parts[2];
                const month = parts[1].padStart(2, '0');
                const monthKey = `${year}-${month}`;

                if (!groups[monthKey]) {
                    groups[monthKey] = { rows: [], totalCost: 0, totalItems: 0 };
                }

                groups[monthKey].rows.push(row);
                groups[monthKey].totalCost += parseValue(row.totalPrice) || 0;
                groups[monthKey].totalItems += 1;
            }
        });
        
        return groups;
    }, [tableData, searchTerm]);

    const sortedMonthKeys = useMemo(() => Object.keys(groupedData).sort().reverse(), [groupedData]);

    useEffect(() => {
        if (sortedMonthKeys.length > 0) {
            setExpandedMonths(new Set([sortedMonthKeys[0]]));
        } else {
            setExpandedMonths(new Set());
        }
    }, [sortedMonthKeys]);

    const handleMonthToggle = (monthKey: string) => {
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(monthKey)) {
                newSet.delete(monthKey);
            } else {
                newSet.add(monthKey);
            }
            return newSet;
        });
    };

    const formatNumericCell = (value: string | number | null, decimals = 2) => {
        const num = parseValue(value);
        if (num === null) {
            return value || '-';
        }
        const hasDecimal = num % 1 !== 0;
        return num.toLocaleString('en-US', {
            minimumFractionDigits: hasDecimal ? decimals : 0,
            maximumFractionDigits: decimals
        });
    };

    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#3B82F6', '#8B5CF6'];
    const tickColor = theme === 'dark' ? '#94A3B8' : '#64748B';

    const RADIAN = Math.PI / 180;
    const renderCustomizedLabel = (props: any) => {
        const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, name, fill } = props;
        const radiusInside = innerRadius + (outerRadius - innerRadius) * 0.5;
        const xInside = cx + radiusInside * Math.cos(-midAngle * RADIAN);
        const yInside = cy + radiusInside * Math.sin(-midAngle * RADIAN);
        const sin = Math.sin(-midAngle * RADIAN);
        const cos = Math.cos(-midAngle * RADIAN);
        const sx = cx + (outerRadius + 10) * cos;
        const sy = cy + (outerRadius + 10) * sin;
        const mx = cx + (outerRadius + 25) * cos;
        const my = cy + (outerRadius + 25) * sin;
        const ex = mx + (cos >= 0 ? 1 : -1) * 12;
        const ey = my;
        const textAnchor = cos >= 0 ? 'start' : 'end';
        const formattedValue = `฿${Number(value).toLocaleString('th-TH')}`;
        const percentageText = `${(Number(percent) * 100).toFixed(0)}%`;
        return (
            <g>
                <text x={xInside} y={yInside} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize="14" fontWeight="bold">
                    {percentageText}
                </text>
                <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} textAnchor={textAnchor} fill={tickColor} fontSize="12">{name}</text>
                <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} dy={14} textAnchor={textAnchor} fill={tickColor} fontSize="12" fontWeight="bold">
                    {formattedValue}
                </text>
            </g>
        );
    };

    const componentMap = useMemo(() => {
        const map: { [key: string]: { component: React.ReactNode; className: string } } = {};

        kpis.forEach((kpi, index) => {
            map[`kpi-${index}`] = {
                component: <KPICard {...kpi} title={t(kpi.title as any)} />,
                className: "col-span-1 sm:col-span-1 lg:col-span-1"
            };
        });
        
        map['monthlyCost'] = {
            component: <MainChart data={chartData} title={t('monthlyConsumablesCost')} theme={theme} valueFormatter={(val) => val.toLocaleString('en-US', { style: 'currency', currency: 'USD', notation: 'compact' })} />,
            className: "col-span-1 sm:col-span-2 lg:col-span-2"
        };
        map['comparison'] = {
            component: (
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-lg h-full">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('periodComparison')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ComparisonStatCard title={t('yoyComparison')} currentValue={comparisonData.yearOverYear.currentYearTotal} previousValue={comparisonData.yearOverYear.lastYearTotal} formatter={(v) => `฿${v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                        <ComparisonStatCard title={t('momComparison')} currentValue={comparisonData.monthOverMonth.currentMonthTotal} previousValue={comparisonData.monthOverMonth.lastMonthTotal} formatter={(v) => `฿${v.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                    </div>
                </div>
            ),
            className: "col-span-1 sm:col-span-2 lg:col-span-2"
        };
        map['costByDept'] = {
            component: (
                <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 shadow-lg h-full">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary mb-6">{t('costByDepartment')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                            <Pie data={costByDept} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} labelLine={false} label={renderCustomizedLabel} paddingAngle={2}>
                                {costByDept.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value: number) => value.toLocaleString(undefined, {minimumFractionDigits: 2})} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ),
            className: "col-span-1 sm:col-span-2 lg:col-span-2"
        };
        map['topItems'] = {
            component: (
                 <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col h-full">
                    <div className="p-6 border-b border-light-border dark:border-dark-border"><h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('top5FrequentItems')}</h3></div>
                    <div className="overflow-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10"><tr className="border-b border-light-border dark:border-dark-border"><th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('name')}</th><th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('frequency')}</th><th className="p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('totalCost')}</th></tr></thead>
                            <tbody className="divide-y divide-light-border dark:divide-dark-border">{topItems.map((item) => <tr key={item.material} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50 transition-colors cursor-pointer" onClick={() => handleTopItemClick(item)}><td className="p-4 text-sm max-w-xs truncate text-light-text-primary dark:text-dark-text-primary" title={item.name}>{item.name}</td><td className="p-4 text-sm text-right text-light-text-primary dark:text-dark-text-primary">{item.frequency}</td><td className="p-4 text-sm text-right font-semibold text-light-text-primary dark:text-dark-text-primary">{item.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</td></tr>)}</tbody>
                        </table>
                    </div>
                </div>
            ),
            className: "col-span-1 sm:col-span-2 lg:col-span-2"
        };
        return map;
    }, [kpis, chartData, topItems, costByDept, comparisonData, theme, t]);

    if (tableData.length === 0) {
        return (
            <div className="mt-8 flex items-center justify-center bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg p-16">
                <div className="text-center">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-light-text-secondary dark:text-dark-text-secondary" />
                    <h3 className="mt-4 text-lg font-medium text-light-text-primary dark:text-dark-text-primary">{t('noDataLoaded')}</h3>
                    <p className="mt-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">{t('noDataLoadedMessageConsumables')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 {componentOrder.map((componentId, index) => {
                    const item = componentMap[componentId];
                    if (!item) return null;

                    return (
                        <div
                            key={componentId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragEnd={handleDragEnd}
                            className={`${item.className} cursor-grab active:cursor-grabbing transition-shadow duration-300`}
                        >
                            {item.component}
                        </div>
                    );
                })}
            </div>
            
            <div className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg flex flex-col">
                <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-center flex-wrap gap-4">
                    <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{t('recentTransactions')}</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <MagnifyingGlassIcon className="h-5 w-5 absolute top-1/2 left-3 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                            <input type="text" placeholder={t('searchTransactions')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border rounded-lg pl-10 pr-4 py-2 w-full sm:w-64" />
                        </div>
                    </div>
                </div>
                <div className="overflow-auto max-h-[600px]">
                    <table className="w-full text-left min-w-[1024px]">
                        <thead className="sticky top-0 bg-light-card dark:bg-dark-card z-10">
                            <tr className="border-b border-light-border dark:border-dark-border">
                                {headers.map(h => 
                                    <th key={h} className={`p-4 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase ${numericHeaders.includes(h) ? 'text-right' : ''}`}>
                                        {h}
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedMonthKeys.length > 0 ? (
                                sortedMonthKeys.map(monthKey => {
                                    const group = groupedData[monthKey];
                                    const isExpanded = expandedMonths.has(monthKey);
                                    return (
                                        <React.Fragment key={monthKey}>
                                            <tr 
                                                className="bg-slate-100 dark:bg-dark-bg/60 sticky top-12 z-[9] cursor-pointer hover:bg-slate-200 dark:hover:bg-dark-bg/80 transition-colors"
                                                onClick={() => handleMonthToggle(monthKey)}
                                            >
                                                <td colSpan={headers.length} className="p-3">
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-3">
                                                            <ChevronDownIcon 
                                                                className={`h-5 w-5 transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary ${isExpanded ? 'rotate-180' : ''}`} 
                                                            />
                                                            <span className="font-bold text-lg text-light-text-primary dark:text-dark-text-primary">
                                                                {formatMonthForDisplay(monthKey)}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary flex gap-4">
                                                            <span>{`${t('kpiTotalItems')}: ${group.totalItems}`}</span>
                                                            <span>{`${t('totalCost')}: ฿${formatNumericCell(group.totalCost)}`}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && group.rows.map((row, i) => (
                                                <tr key={`${row.material}-${i}`} className="hover:bg-slate-50 dark:hover:bg-dark-bg/50">
                                                    <td className="p-4 text-sm whitespace-nowrap text-light-text-primary dark:text-dark-text-primary">{row.date}</td>
                                                    <td className="p-4 text-sm whitespace-nowrap text-light-text-primary dark:text-dark-text-primary">{row.material}</td>
                                                    <td className="p-4 text-sm max-w-sm truncate text-light-text-primary dark:text-dark-text-primary" title={row.description}>{row.description}</td>
                                                    <td className="p-4 text-sm text-right text-light-text-primary dark:text-dark-text-primary">{formatNumericCell(row.quantity, 0)}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.unit}</td>
                                                    <td className="p-4 text-sm text-right text-light-text-primary dark:text-dark-text-primary">{formatNumericCell(row.price)}</td>
                                                    <td className="p-4 text-sm text-right font-semibold text-light-text-primary dark:text-dark-text-primary">{formatNumericCell(row.totalPrice)}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.costCenter}</td>
                                                    <td className="p-4 text-sm text-light-text-primary dark:text-dark-text-primary">{row.department}</td>
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={headers.length} className="text-center p-8 text-light-text-secondary dark:text-dark-text-secondary">
                                        {t('noResultsFound')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {selectedTopItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTopItem(null)}>
                    <div 
                        className="bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-light-border dark:border-dark-border flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">
                                    {t('topItemDetailsModalTitle')}
                                </h2>
                                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-1">
                                    {selectedTopItem.name}
                                </p>
                            </div>
                            <button onClick={() => setSelectedTopItem(null)} className="p-2 hover:bg-light-bg dark:hover:bg-dark-bg rounded-lg"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-light-card dark:bg-dark-card">
                                    <tr className="border-b border-light-border dark:border-dark-border">
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase">{t('department')}</th>
                                        <th className="p-3 text-sm font-semibold text-light-text-secondary dark:text-dark-text-secondary uppercase text-right">{t('totalCost')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-light-border dark:divide-dark-border">
                                    {topItemDetails.map(detail => (
                                        <tr key={detail.department}>
                                            <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary">{detail.department}</td>
                                            <td className="p-3 text-sm text-light-text-primary dark:text-dark-text-primary text-right font-semibold">
                                                {`฿${detail.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 mt-auto border-t border-light-border dark:border-dark-border flex justify-end">
                             <button
                                onClick={() => setSelectedTopItem(null)}
                                className="px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors duration-300"
                            >
                                {t('close')}
                            </button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default ConsumablesReport;
