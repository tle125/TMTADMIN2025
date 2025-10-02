import React from 'react';
import {
    AcademicCapIcon, ArchiveBoxIcon, BookIcon, BuildingOfficeIcon, CalendarDaysIcon, ChartBarIcon, ChartPieIcon, ClipboardDocumentCheckIcon, ClockIcon, Cog6ToothIcon, CubeIcon, CurrencyDollarIcon, DocumentTextIcon, ExclamationTriangleIcon, ForkliftIcon, HomeIcon, LeafIcon, MedicalBagIcon, QuestionMarkCircleIcon, ShieldCheckIcon, ShoppingCartIcon, SparklesIcon, StairsIcon, UserGroupIcon, UsersIcon
} from './components/icons';

export const ICON_MAP: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
    AcademicCapIcon, ArchiveBoxIcon, BookIcon, BuildingOfficeIcon, CalendarDaysIcon, ChartBarIcon, ChartPieIcon, ClipboardDocumentCheckIcon, ClockIcon, Cog6ToothIcon, CubeIcon, CurrencyDollarIcon, DocumentTextIcon, ExclamationTriangleIcon, ForkliftIcon, HomeIcon, LeafIcon, MedicalBagIcon, QuestionMarkCircleIcon, ShieldCheckIcon, ShoppingCartIcon, SparklesIcon, StairsIcon, UserGroupIcon, UsersIcon
};

export const parseValue = (val: any): number | null => {
    if (val === '-' || val === '#DIV/0!' || val == null || String(val).trim() === '') return null;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        // Remove currency symbols, commas, percentage signs, and other non-numeric characters before parsing.
        const cleanedString = val.replace(/[^0-9.-]/g, '');
        if (cleanedString === '') return null;
        const num = parseFloat(cleanedString);
        return isNaN(num) ? null : num;
    }
    return null;
};

/**
 * Formats a number as a percentage string.
 * - Shows 0 decimal places for whole numbers (e.g., 100).
 * - Shows 2 decimal places for fractional numbers (e.g., 85.12).
 */
export const formatPercentage = (percentage: number): string => {
    if (isNaN(percentage)) return 'N/A';
    if (percentage % 1 === 0) {
        return `${percentage.toFixed(0)}%`;
    }
    return `${percentage.toFixed(2)}%`;
};


// ฟังก์ชันแปลงค่า Score เป็นเปอร์เซ็นต์
export const formatScoreAsPercentage = (score: string | number): string => {
    if (!score || score === 'N/A' || score === '-') return String(score);
    
    const numericScore = parseFloat(String(score).replace(/[^0-9.-]/g, ''));
    if (!isNaN(numericScore)) {
        const percentage = numericScore <= 1 && numericScore > 0 ? numericScore * 100 : numericScore;
        return formatPercentage(percentage);
    }
    
    return String(score);
};

// ฟังก์ชันแปลงค่า Score สำหรับ KPI Details table
export const formatScoreForKpiDetails = (score: string | number, kpiTitle: string): string => {
    if (!score || score === 'N/A' || score === '-') return String(score);
    
    const titleLower = String(kpiTitle).toLowerCase();
    
    // สำหรับ Availability of forklifts ให้แสดงเป็น "วัน"
    if (titleLower.includes('availability') && titleLower.includes('forklift') || 
        titleLower.includes('ความพร้อมของรถยก') || 
        titleLower.includes('avaliability')) {
        
        const numericScore = parseFloat(String(score).replace(/[^0-9.-]/g, ''));
        if (!isNaN(numericScore)) {
            return `${numericScore} วัน`;
        }
        return String(score);
    }
    
    return formatScoreAsPercentage(score);
};

// ฟังก์ชันแก้ไขค่า Score ของ KPI เฉพาะ
export const modifySpecificKpiScore = (title: string, originalScore: string | number): string => {
    if (!originalScore || originalScore === 'N/A' || originalScore === '-') {
        return String(originalScore);
    }
    
    const titleLower = String(title).toLowerCase();
    
    if (titleLower.includes('availability') && titleLower.includes('forklift') || 
        titleLower.includes('ความพร้อมของรถยก') || 
        titleLower.includes('avaliability')) {
        const numericScore = parseFloat(String(originalScore).replace(/[^0-9.-]/g, ''));
        if (!isNaN(numericScore)) {
            return numericScore.toString();
        }
        return String(originalScore);
    }
    
    return formatScoreAsPercentage(originalScore);
};

// ฟังก์ชันกำหนดไอคอนสำหรับ KPI แต่ละตัว
export const getKpiIcon = (title: string): string => {
    const titleLower = String(title).toLowerCase();
    
    if (titleLower.includes('availability') && titleLower.includes('forklift') || 
        titleLower.includes('ความพร้อมของรถยก') || 
        titleLower.includes('avaliability')) {
        return 'CubeIcon';
    }
    
    if (titleLower.includes('initiative') && titleLower.includes('carbon') || 
        titleLower.includes('โครงการลดการปล่อยก๊าซคาร์บอน') ||
        titleLower.includes('carbon') && titleLower.includes('emission')) {
        return 'SparklesIcon';
    }
    
    if (titleLower.includes('อัตราการเกิดอุบัติเหตุ') && titleLower.includes('ifr') || 
        titleLower.includes('ifr') && titleLower.includes('2024') ||
        titleLower.includes('accident') && titleLower.includes('ifr')) {
        return 'ShieldCheckIcon';
    }
    
    if (titleLower.includes('lean') && titleLower.includes('management') || 
        titleLower.includes('กำหนดแผนพัฒนา') ||
        titleLower.includes('lean mamagement system')) {
        return 'ChartPieIcon';
    }
    
    if (titleLower.includes('idp') && titleLower.includes('implementation') || 
        titleLower.includes('idp implementation succeed g4-g7') ||
        titleLower.includes('โดยให้พนักงานในแผนก')) {
        return 'AcademicCapIcon';
    }
    
    return 'ChartBarIcon';
};

export const DB_STORAGE_KEY = 'kpiDashboardDatabase';