
export interface ApiQueryParams {
    days?: string;
    hours?: string;
    date?: string;
}

export interface ProcessedParams {
    days: number;
    hours: number;
    startDate: Date;
}

export interface ApiSuccessResponse {
    date: string; // Fecha en formato ISO 8601 UTC con Z
}

export interface ApiErrorResponse {
    error: string;
    message: string;
}

export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

export interface WorkingHours {
    start: number; // Hora de inicio (8)
    end: number;   // Hora de fin (17)
    lunchStart: number; // Inicio del almuerzo (12)
    lunchEnd: number;   // Fin del almuerzo (13)
}

export interface WorkingDays {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
}

export interface WorkingConfig {
    hours: WorkingHours;
    days: WorkingDays;
    timezone: string;
}

export type HolidayDate = string; // Formato YYYY-MM-DD

export enum ApiErrors {
    INVALID_PARAMETERS = 'InvalidParameters',
    INTERNAL_ERROR = 'InternalError',
    INVALID_DATE_FORMAT = 'InvalidDateFormat',
    NEGATIVE_VALUES = 'NegativeValues'
}
