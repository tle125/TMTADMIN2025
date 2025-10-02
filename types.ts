export interface Kpi {
  kpiNo?: string;
  title: string;
  value: string;
  target?: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  icon: string;
  color: string;
  comparison?: {
    value: string;
    percentage: string;
    period: 'month' | 'year';
  };
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface TableRow {
  kpiNo: string;
  kpi: {
    title: string;
    measurement: string;
  };
  target: string;
  score: string;
  result: string;
  monthlyData: { [key: string]: string };
  description: string;
  objective: string;
  measurementMethod: string;
  responsible: string;
  improvementPlan: string;
}

export interface ConsumableRow {
  date: string;
  material: string;
  description: string;
  quantity: string;
  unit: string;
  price: string;
  totalPrice: string;
  costCenter: string;
  department: string;
}

export interface OtRow {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  grade: string;
  status: string;
  monthlyOT: number[];
  totalOT: number;
}

export interface LeaveRow {
  id: string;
  employeeId: string;
  name: string;
  position: string;
  department: string;
  grade: string;
  status: string;
  monthlyLeave: number[];
  leaveWithoutVacation: number;
  totalLeaveWithVacation: number;
  vacationCarriedOver: number;
  vacationEntitlement: number;
  totalVacation: number;
  vacationUsed: number;
  vacationAccrued: number;
  sickLeave: number;
  personalLeave: number;
  birthdayLeave: number;
  otherLeave: number;
  totalLeave: number;
}

export interface AccidentRow {
  id: string;
  incidentDate: string;
  incidentTime: string;
  severity: string;
  occurrence: string;
  department: string;
  employeeId: string;
  employeeName: string;
  position: string;
  details: string;
  cause: string;
  prevention: string;
  damageValue: number;
  insuranceClaim: string;
  actionTaken: string;
  penalty: string;
  remarks: string;
  accidentLocation: string;
}

export interface WorkloadDetailRow {
    description: string;
    isSubRow: boolean;
    unit: string;
    values: (number | null)[];
    average: number | null;
    min: number | null;
    max: number | null;
}

export interface WorkloadProductSection {
    product: string;
    isSubProduct?: boolean;
    rows: WorkloadDetailRow[];
}