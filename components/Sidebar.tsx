import React, { ReactElement } from 'react';
import { useTranslation } from '../context/LanguageProvider';
import { HomeIcon, ClipboardDocumentListIcon, ClockIcon, CalendarDaysIcon, ExclamationTriangleIcon, UserGroupIcon, ChartPieIcon, DocumentTextIcon, Cog6ToothIcon, QuestionMarkCircleIcon, BoltIcon, XMarkIcon, ChartBarIcon } from './icons';

interface NavLinkProps {
  icon: ReactElement;
  text: string;
  active: boolean;
  onClick: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ icon, text, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-lg rounded-lg transition-colors duration-200 text-left ${
      active
        ? 'bg-brand-primary text-white font-semibold shadow-lg'
        : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-dark-card hover:text-light-text-primary dark:hover:text-dark-text-primary'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    <span className="mr-4">{icon}</span>
    {text}
  </button>
);

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, onNavigate, isOpen, onClose }) => {
  const { t } = useTranslation();
  
  const navItems = [
    { key: 'kpiReport', icon: <HomeIcon className="h-6 w-6" /> },
    { key: 'consumablesReport', icon: <ClipboardDocumentListIcon className="h-6 w-6" /> },
    { key: 'otReport', icon: <ClockIcon className="h-6 w-6" /> },
    { key: 'leaveReport', icon: <CalendarDaysIcon className="h-6 w-6" /> },
    { key: 'accidentReport', icon: <ExclamationTriangleIcon className="h-6 w-6" /> },
    { key: 'workloadReport', icon: <UserGroupIcon className="h-6 w-6" /> },
    { key: 'comparisonReport', icon: <ChartBarIcon className="h-6 w-6" /> },
    { key: 'reports', icon: <ChartPieIcon className="h-6 w-6" /> },
    { key: 'documents', icon: <DocumentTextIcon className="h-6 w-6" /> },
    { key: 'settings', icon: <Cog6ToothIcon className="h-6 w-6" /> },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border p-6 flex flex-col transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center">
            <BoltIcon className="h-10 w-10 text-brand-primary" />
            <span className="text-2xl font-bold ml-3 text-light-text-primary dark:text-dark-text-primary">{t('analytics')}</span>
        </div>
        <button onClick={onClose} className="lg:hidden text-light-text-secondary dark:text-dark-text-secondary">
            <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-3">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            icon={item.icon}
            text={t(item.key as any)}
            active={activePage === item.key}
            onClick={() => onNavigate(item.key)}
          />
        ))}
      </nav>
      <div className="mt-auto">
        <NavLink 
          icon={<QuestionMarkCircleIcon className="h-6 w-6" />} 
          text={t('helpCenter')}
          active={activePage === 'helpCenter'}
          onClick={() => onNavigate('helpCenter')}
        />
      </div>
    </aside>
  );
};

export default Sidebar;