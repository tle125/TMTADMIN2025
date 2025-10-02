
import React from 'react';
import { ArrowTrendingDownIcon, CheckCircleIcon, MinusIcon } from './icons';
import { useTranslation } from '../context/LanguageProvider';
import { Kpi } from '../types';
import { ICON_MAP } from '../constants';

const KPICard: React.FC<Kpi> = ({ kpiNo, title, value, target, trend, trendDirection = 'neutral', icon, color, comparison }) => {
  const { t } = useTranslation();

  const TrendIcon = () => {
    switch (trendDirection) {
      case 'up':
        return <CheckCircleIcon className="h-5 w-5 text-brand-success" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-brand-danger" />;
      default:
        return <MinusIcon className="h-5 w-5 text-light-text-secondary dark:text-dark-text-secondary" />;
    }
  };

  const IconComponent = ICON_MAP[icon];
  const trendColor = trendDirection === 'up' ? 'text-brand-success' : trendDirection === 'down' ? 'text-brand-danger' : 'text-light-text-secondary dark:text-dark-text-secondary';
  
  const ComparisonDisplay = () => {
    if (comparison) {
      return (
        <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
          <TrendIcon />
          <div className="flex items-baseline gap-1">
            <span className={trendColor}>{comparison.percentage}</span>
            <span className="text-light-text-secondary dark:text-dark-text-secondary">({comparison.value})</span>
          </div>
          <span className="text-light-text-secondary dark:text-dark-text-secondary">
            {comparison.period === 'year' ? t('vsLastYear') : t('vsLastMonth')}
          </span>
        </div>
      );
    }
    if (trend) {
      return (
        <div className="flex items-center gap-2 text-md">
          <TrendIcon />
          <span className={trendColor}>{trend}</span>
          <span className="text-light-text-secondary dark:text-dark-text-secondary">{t('vsLastMonth')}</span>
        </div>
      );
    }
    return null;
  };

  // If there's no kpiNo, we assume it's a summary card that needs centering.
  // This applies to the cards on the Consumables report page.
  if (!kpiNo) {
    return (
      <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 flex flex-col justify-between items-center text-center transform hover:-translate-y-1 transition-transform duration-300 shadow-lg min-h-[200px] sm:min-h-[220px]">
        {/* Top section is just the title, centered */}
        <h3 className="text-base sm:text-lg font-medium text-light-text-secondary dark:text-dark-text-secondary w-full">
          {title}
        </h3>

        {/* Middle section with Icon and Value, takes up remaining space */}
        <div className="flex-1 flex flex-col justify-center items-center gap-3 py-2">
          <div className={color}>
            {IconComponent && <IconComponent className="h-8 w-8" />}
          </div>
          <p className="text-3xl sm:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">{value}</p>
        </div>
        
        {/* Bottom section with comparison info, centered */}
        <ComparisonDisplay />
      </div>
    );
  }
  
  // Original layout for cards with kpiNo
  return (
    <div className="relative bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl p-6 flex flex-col justify-between transform hover:-translate-y-1 transition-transform duration-300 shadow-lg min-h-[200px] sm:min-h-[220px]">
      
      {kpiNo && (
        <div className="absolute top-4 left-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 rounded-full h-8 w-8 flex items-center justify-center font-bold text-sm flex-shrink-0">
          {kpiNo}
        </div>
      )}

      {/* Top Section: Header */}
      <div>
        <div className="flex items-start justify-between">
          <h3 className={`text-base sm:text-lg font-medium text-light-text-secondary dark:text-dark-text-secondary ${kpiNo ? 'pl-12' : ''}`}>
            {title}
          </h3>
          <div className={color}>
            {IconComponent && <IconComponent className="h-8 w-8" />}
          </div>
        </div>
      </div>

      {/* Bottom Section: Value and Trend */}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-3xl sm:text-4xl font-bold text-light-text-primary dark:text-dark-text-primary">{value}</p>
          {target && target !== 'N/A' && (
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
              {t('target')}: {target}
            </p>
          )}
        </div>
        <ComparisonDisplay />
      </div>
    </div>
  );
};

export default KPICard;
