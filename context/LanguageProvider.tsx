import React, { createContext, useState, useEffect, useContext, ReactNode, FC } from 'react';

const translations = {
    en: {
        'kpiReport': 'KPI Report', 'consumablesReport': 'Consumables Report', 'otReport': 'OT Report', 'leaveReport': 'Leave Report', 'accidentReport': 'Accident Report', 'workloadReport': 'Workload Report', 'reports': 'Reports', 'documents': 'Documents', 'settings': 'Settings', 'helpCenter': 'Help Center', 'analytics': 'Admin-WH1 Report', 'search': 'Search...', 'uploadKpiData': 'Upload KPI Data', 'shareReport': 'Share Report', 'loadReport': 'Load Report', 'userName': 'Jane Doe', 'userRole': 'Admin', 'vsLastMonth': 'vs last month', 'kpiProgressOverview': 'KPI Progress Overview', 'kpiDetails': 'KPI Details', 'searchDetails': 'Search details...', 'kpi': 'KPI', 'target': 'Target', 'score': 'Score', 'result': 'Result', 'noResultsFound': 'No results found.', 'uploadExcel': 'Upload Excel', 'noDataLoaded': 'No Data Loaded', 'noDataLoadedMessageConsumables': 'Please upload an Excel file using the button above to view the report.', 'monthlyConsumablesCost': 'Monthly Consumables Cost', 'top5FrequentItems': 'Top 5 Frequent Items', 'frequency': 'Frequency', 'totalCost': 'Total Cost', 'costByDepartment': 'Cost by Department', 'department': 'Department', 'recentTransactions': 'Recent Transactions', 'searchTransactions': 'Search transactions...', 'noDataLoadedMessageOT': 'Please upload an Excel file using the button above to view the OT report.', 'monthlyOvertimeHours': 'Monthly Overtime Hours', 'top10EmployeesByOT': 'Top 10 Employees by OT', 'name': 'Name', 'totalHours': 'Total Hours', 'top10DepartmentsByOT': 'Top 10 Departments by OT', 'employeeOTDetails': 'Employee OT Details', 'searchEmployees': 'Search employees...', 'noDataLoadedMessageLeave': 'Please upload an Excel file using the button above to view the Leave report.', 'monthlyLeaveDays': 'Monthly Leave Days', 'top10LeaveEmployees': 'Top 10 Employees by Leave', 'days': 'Days', 'top5LeaveTypes': 'Top 5 Leave Types', 'leaveType': 'Leave Type', 'top5LeaveDepartments': '5 Departments by Leave', 'employeeLeaveDetails': 'Employee Leave Details', 'noDataLoadedMessageAccident': 'Please upload an Excel file using the button above to view the Accident report.', 'noDataLoadedMessageKpi': 'Please upload an Excel file using the button above to view the KPI report.', 'noDataLoadedMessageWorkload': 'Please upload an Excel file using the button above to view the Workload report.', 'accidentsByDepartment': 'Accidents by Department', 'accidentDetails': 'Accident Details', 'searchAccidents': 'Search accidents...', 'workloadByProduct': 'Workload by Product (Ton/Person/Hr.)', 'avgWorkloadRaw': 'Avg. Ton/Hr (Raw Material)', 'avgWorkloadCoil': 'Avg. Ton/Hr (Coil)', 'avgWorkloadFilm': 'Avg. Ton/Hr (Film&Scrap)', 'workloadDetails': 'Workload Details', 'product': 'Product', 'description': 'Description', 'unit': 'Unit', 'underConstruction': 'This page is under construction.', 'pass': 'PASS', 'inProgress': 'In Progress',
        'yoyComparison': 'Year-over-Year Comparison', 'momComparison': 'Month-over-Month Comparison', 'vsLastYear': 'vs last year', 'comparisonReport': 'Comparison',
        'targetModal': 'Target', 'scoreModal': 'Score', 'resultModal': 'Result', 'monthlyData': 'Monthly Data', 'descriptionModal': 'Description', 'objective': 'Objective', 'measurementMethod': 'Measurement Method', 'responsible': 'Responsible', 'improvementPlan': 'Improvement Plan', 'close': 'Close',
        'periodComparison': 'Period Comparison', 'headerDate': 'Date', 'headerMaterial': 'Material', 'headerDescription': 'Description', 'headerQuantity': 'Quantity', 'headerUnit': 'Unit', 'headerPrice': 'Price', 'headerTotalPrice': 'Total Price', 'headerCostCenter': 'Cost Center', 'headerDepartment': 'Department', 'subtotal': 'Subtotal',
        'headerId': 'ID', 'headerEmployeeId': 'Employee ID', 'headerName': 'Name', 'headerPosition': 'Position', 'headerGrade': 'Grade', 'headerStatus': 'Status', 'headerTotal': 'Total', 'departmentLabel': 'Department',
        'monthJan': 'Jan', 'monthFeb': 'Feb', 'monthMar': 'Mar', 'monthApr': 'Apr', 'monthMay': 'May', 'monthJun': 'Jun', 'monthJul': 'Jul', 'monthAug': 'Aug', 'monthSep': 'Sep', 'monthOct': 'Oct', 'monthNov': 'Nov', 'monthDec': 'Dec',
        'headerNo': 'NO.', 'headerEmp': 'EMP.', 'headerNameSurname': 'NAME-SURNAME', 'headerDept': 'DEPT.', 'headerLeaveNoVac': 'Leave (No Vac)', 'headerLeaveWithVac': 'Leave (w/ Vac)', 'headerVacCarried': 'Vac Carried', 'headerVacEntitled': 'Vac Entitled', 'headerTotalVac': 'Total Vac', 'headerVacUsed': 'Vac Used', 'headerVacAccrued': 'Vac Accrued', 'headerSick': 'Sick', 'headerPersonal': 'Personal', 'headerBirthday': 'Birthday', 'headerOther': 'Other', 'leaveTypeVacation': 'Vacation', 'leaveTypeSick': 'Sick Leave', 'leaveTypePersonal': 'Personal Leave', 'leaveTypeBirthday': 'Birthday Leave', 'leaveTypeOther': 'Other Leave',
        'severityBreakdown': 'Severity Breakdown', 'noSeverityData': 'No severity data', 'headerSeq': 'No.', 'headerIncidentDate': 'Incident Date', 'headerIncidentTime': 'Time', 'headerSeverity': 'Severity', 'headerOccurrence': 'Occurrence', 'headerWorkSection': 'Section', 'headerDetails': 'Details', 'headerCause': 'Cause', 'headerPrevention': 'Prevention', 'headerDamageValue': 'Damage Value', 'headerInsuranceClaim': 'Claim', 'headerActionTaken': 'Action Taken', 'headerPenalty': 'Penalty', 'headerRemarks': 'Remarks', 'headerLocation': 'Location',
        'chartRawMaterial': 'Raw Material', 'chartCoil': 'Coil', 'chartFilmScrap': 'Film & Scrap', 'headerAverage': 'AVERAGE', 'headerMin': 'MIN', 'headerMax': 'MAX',
        'totalIncidents': 'Total Incidents', 'totalDamage': 'Total Damage', 'topDepartmentAccident': 'Top Department', 'topSeverity': 'Top Severity',
        'totalOtHours': 'Total OT Hours', 'totalEmployeesOt': 'Total Employees', 'topDepartmentOt': 'Top Department',
        'topMonthOt': 'Top Month', 'totalLeaveDays': 'Total Leave Days', 'topLeaveType': 'Top Leave Type',
        'topDepartmentLeave': 'Top Department', 'topMonthLeave': 'Top Month', 'kpiTotalCost': 'Total Cost',
        'kpiTransactions': 'Transactions', 'kpiTotalItems': 'Total Items', 'kpiDepartments': 'Departments',
        'employees': 'Employees',
        'leaveDetailsModalTitle': 'Leave Breakdown',
        'leaveSummaryNote': 'This is a summary of leave days by type. Specific dates are not available in this view.',
        'leaveTypeDetailsModalTitle': 'Details by Department',
        'departmentLeaveDetailsModalTitle': 'Leave Details by Type',
        'topItemDetailsModalTitle': 'Item Details by Department',
    },
    th: {
        'kpiReport': 'รายงาน KPI', 'consumablesReport': 'วัสดุสิ้นเปลือง', 'otReport': 'รายงาน OT', 'leaveReport': 'รายงานการลา', 'accidentReport': 'รายงานอุบัติเหตุ', 'workloadReport': 'ปริมาณการทำงานต่อคน', 'reports': 'รายงานอื่นๆ', 'documents': 'เอกสาร', 'settings': 'ตั้งค่า', 'helpCenter': 'ศูนย์ช่วยเหลือ', 'analytics': 'รายงานAdmin-WH1', 'search': 'ค้นหา...', 'uploadKpiData': 'อัปโหลดข้อมูล KPI', 'shareReport': 'แชร์รายงาน', 'loadReport': 'โหลดรายงาน', 'userName': 'เจน โด', 'userRole': 'ผู้ดูแลระบบ', 'vsLastMonth': 'เทียบกับเดือนที่แล้ว', 'kpiProgressOverview': 'ภาพรวมความคืบหน้า KPI', 'kpiDetails': 'รายละเอียด KPI', 'searchDetails': 'ค้นหารายละเอียด...', 'kpi': 'KPI', 'target': 'เป้าหมาย', 'score': 'คะแนน', 'result': 'ผลลัพธ์', 'noResultsFound': 'ไม่พบผลลัพธ์', 'uploadExcel': 'อัปโหลด Excel', 'noDataLoaded': 'ไม่มีข้อมูล', 'noDataLoadedMessageConsumables': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงาน', 'monthlyConsumablesCost': 'ค่าใช้จ่ายวัสดุสิ้นเปลืองรายเดือน', 'top5FrequentItems': '5 อันดับรายการที่ใช้บ่อยที่สุด', 'frequency': 'ความถี่', 'totalCost': 'ต้นทุนรวม', 'costByDepartment': 'ค่าใช้จ่ายตามแผนก', 'department': 'แผนก', 'recentTransactions': 'ธุรกรรมล่าสุด', 'searchTransactions': 'ค้นหาธุรกรรม...', 'noDataLoadedMessageOT': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงาน OT', 'monthlyOvertimeHours': 'ชั่วโมงล่วงเวลาแต่ละเดือน', 'top10EmployeesByOT': '10 อันดับพนักงานที่ทำ OT สูงสุด', 'name': 'ชื่อ', 'totalHours': 'ชั่วโมงรวม', 'top10DepartmentsByOT': '10 อันดับแผนกที่ทำ OT สูงสุด', 'employeeOTDetails': 'รายละเอียด OT ของพนักงาน', 'searchEmployees': 'ค้นหาพนักงาน...', 'noDataLoadedMessageLeave': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานการลา', 'monthlyLeaveDays': 'จำนวนวันลาแต่ละเดือน', 'top10LeaveEmployees': '10 อันดับพนักงานที่ลามากที่สุด', 'days': 'วัน', 'top5LeaveTypes': '5 อันดับประเภทการลา', 'leaveType': 'ประเภทการลา', 'top5LeaveDepartments': '5 อันดับส่วนงานที่ลามากที่สุด', 'employeeLeaveDetails': 'รายละเอียดการลาของพนักงาน', 'noDataLoadedMessageAccident': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานอุบัติเหตุ', 'noDataLoadedMessageKpi': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงาน KPI', 'noDataLoadedMessageWorkload': 'กรุณาอัปโหลดไฟล์ Excel เพื่อดูรายงานปริมาณงาน', 'accidentsByDepartment': 'อุบัติเหตุตามส่วนงาน', 'accidentDetails': 'รายละเอียดอุบัติเหตุ', 'searchAccidents': 'ค้นหาอุบัติเหตุ...', 'workloadByProduct': 'ปริมาณงานตามผลิตภัณฑ์ (ตัน/คน/ชม.)', 'avgWorkloadRaw': 'เฉลี่ย Ton/Hr (Raw Material)', 'avgWorkloadCoil': 'เฉลี่ย Ton/Hr (Coil)', 'avgWorkloadFilm': 'เฉลี่ย Ton/Hr (Film&Scrap)', 'workloadDetails': 'รายละเอียดปริมาณงาน', 'product': 'ผลิตภัณฑ์', 'description': 'คำอธิบาย', 'unit': 'หน่วย', 'underConstruction': 'หน้านี้กำลังอยู่ระหว่างการพัฒนา', 'pass': 'ผ่าน', 'inProgress': 'ดำเนินการอยู่',
        'yoyComparison': 'เปรียบเทียบรายปี', 'momComparison': 'เปรียบเทียบรายเดือน', 'vsLastYear': 'เทียบกับปีที่แล้ว', 'comparisonReport': 'เปรียบเทียบ',
        'targetModal': 'เป้าหมาย', 'scoreModal': 'คะแนน', 'resultModal': 'ผลลัพธ์', 'monthlyData': 'ข้อมูลรายเดือน', 'descriptionModal': 'คำอธิบาย', 'objective': 'วัตถุประสงค์', 'measurementMethod': 'วิธีการวัด', 'responsible': 'ผู้รับผิดชอบ', 'improvementPlan': 'แผนการปรับปรุง', 'close': 'ปิด',
        'periodComparison': 'เปรียบเทียบช่วงเวลา', 'headerDate': 'วันที่', 'headerMaterial': 'วัสดุ', 'headerDescription': 'คำอธิบาย', 'headerQuantity': 'จำนวน', 'headerUnit': 'หน่วย', 'headerPrice': 'ราคา', 'headerTotalPrice': 'ราคารวม', 'headerCostCenter': 'Cost Center', 'headerDepartment': 'แผนก', 'subtotal': 'ยอดรวมย่อย',
        'headerId': 'ID', 'headerEmployeeId': 'รหัสพนักงาน', 'headerName': 'ชื่อ', 'headerPosition': 'ตำแหน่ง', 'headerGrade': 'ระดับ', 'headerStatus': 'สถานะ', 'headerTotal': 'รวม', 'departmentLabel': 'แผนก',
        'monthJan': 'ม.ค.', 'monthFeb': 'ก.พ.', 'monthMar': 'มี.ค.', 'monthApr': 'เม.ย.', 'monthMay': 'พ.ค.', 'monthJun': 'มิ.ย.', 'monthJul': 'ก.ค.', 'monthAug': 'ส.ค.', 'monthSep': 'ก.ย.', 'monthOct': 'ต.ค.', 'monthNov': 'พ.ย.', 'monthDec': 'ธ.ค.',
        'headerNo': 'ลำดับ', 'headerEmp': 'รหัส', 'headerNameSurname': 'ชื่อ-สกุล', 'headerDept': 'แผนก', 'headerLeaveNoVac': 'ลา (ไม่รวมพักร้อน)', 'headerLeaveWithVac': 'ลา (รวมพักร้อน)', 'headerVacCarried': 'พักร้อนยกมา', 'headerVacEntitled': 'สิทธิพักร้อน', 'headerTotalVac': 'รวมพักร้อน', 'headerVacUsed': 'ใช้พักร้อน', 'headerVacAccrued': 'พักร้อนสะสม', 'headerSick': 'ลาป่วย', 'headerPersonal': 'ลากิจ', 'headerBirthday': 'วันเกิด', 'headerOther': 'อื่นๆ', 'leaveTypeVacation': 'ลาพักร้อน', 'leaveTypeSick': 'ลาป่วย', 'leaveTypePersonal': 'ลากิจ', 'leaveTypeBirthday': 'ลาวันเกิด', 'leaveTypeOther': 'ลาอื่นๆ',
        'severityBreakdown': 'เคสตามความรุนแรง', 'noSeverityData': 'ไม่มีข้อมูลความรุนแรง', 'headerSeq': 'ลำดับ', 'headerIncidentDate': 'วันที่เกิดเหตุ', 'headerIncidentTime': 'เวลา', 'headerSeverity': 'ความรุนแรง', 'headerOccurrence': 'ครั้งที่', 'headerWorkSection': 'ส่วนงาน', 'headerDetails': 'รายละเอียด', 'headerCause': 'สาเหตุ', 'headerPrevention': 'มาตรการป้องกัน', 'headerDamageValue': 'มูลค่าความเสียหาย', 'headerInsuranceClaim': 'การเคลม', 'headerActionTaken': 'การดำเนินการ', 'headerPenalty': 'บทลงโทษ', 'headerRemarks': 'หมายเหตุ', 'headerLocation': 'สถานที่',
        'chartRawMaterial': 'วัตถุดิบ', 'chartCoil': 'คอยล์', 'chartFilmScrap': 'ฟิล์มและเศษเหล็ก', 'headerAverage': 'เฉลี่ย', 'headerMin': 'ต่ำสุด', 'headerMax': 'สูงสุด',
        'totalIncidents': 'อุบัติเหตุทั้งหมด', 'totalDamage': 'ความเสียหายทั้งหมด', 'topDepartmentAccident': 'แผนกเกิดเหตุสูงสุด', 'topSeverity': 'ความรุนแรงสูงสุด',
        'totalOtHours': 'ชั่วโมง OT ทั้งหมด', 'totalEmployeesOt': 'พนักงานทั้งหมด', 'topDepartmentOt': 'แผนก OT สูงสุด',
        'topMonthOt': 'เดือน OT สูงสุด', 'totalLeaveDays': 'วันลาทั้งหมด', 'topLeaveType': 'ประเภทการลาสูงสุด',
        'topDepartmentLeave': 'แผนกที่ลาสูงสุด', 'topMonthLeave': 'เดือนที่ลาสูงสุด', 'kpiTotalCost': 'ค่าใช้จ่ายทั้งหมด',
        'kpiTransactions': 'จำนวนธุรกรรม', 'kpiTotalItems': 'จำนวนรายการ', 'kpiDepartments': 'จำนวนแผนก',
        'employees': 'พนักงาน',
        'leaveDetailsModalTitle': 'รายละเอียดการลา',
        'leaveSummaryNote': 'นี่คือสรุปจำนวนวันลาตามประเภท ไม่สามารถดูวันที่เจาะจงได้จากมุมมองนี้',
        'leaveTypeDetailsModalTitle': 'รายละเอียดตามแผนก',
        'departmentLeaveDetailsModalTitle': 'รายละเอียดการลาตามประเภท',
        'topItemDetailsModalTitle': 'รายละเอียดรายการตามแผนก',
    }
};

type Language = 'en' | 'th';
type Translations = typeof translations.en;

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: keyof Translations) => string;
}

const getInitialState = <T,>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue) as T;
        }
    } catch (error) {
        console.error(`Error reading "${key}" from localStorage`, error);
        localStorage.removeItem(key);
    }
    return defaultValue;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

// FIX: Explicitly define props type to help TypeScript's type inference.
interface LanguageProviderProps {
    children: ReactNode;
}

// FIX: Changed component to be explicitly typed as a React.FC to resolve a subtle type inference issue where the 'children' prop was not being recognized.
export const LanguageProvider: FC<LanguageProviderProps> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(getInitialState('language', 'en'));

    useEffect(() => {
        localStorage.setItem('language', JSON.stringify(language));
        document.body.style.fontFamily = language === 'th' ? "'Sarabun', sans-serif" : "'Inter', sans-serif";
    }, [language]);

    const toggleLanguage = () => {
        setLanguage(lang => (lang === 'en' ? 'th' : 'en'));
    };

    const t = (key: keyof Translations): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};
