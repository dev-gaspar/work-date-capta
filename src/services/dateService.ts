import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { ProcessedParams, WorkingConfig } from '../types';
import { holidayManager } from '../utils/holidayUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

// Configuración de trabajo para Colombia
export const WORKING_CONFIG: WorkingConfig = {
    hours: {
        start: 8,
        end: 17,
        lunchStart: 12,
        lunchEnd: 13
    },
    days: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false
    },
    timezone: 'America/Bogota'
};


export class DateService {

    // Calcular fecha hábil resultante después de sumar días y horas
    public calculateWorkingDate(params: ProcessedParams): string {
        // Convertir fecha de inicio a zona horaria
        let currentDate = dayjs(params.startDate).tz(WORKING_CONFIG.timezone);

        // Verificar el estado inicial de la fecha
        const isInitiallyInWorkingTime = this.isInWorkingTime(currentDate);
        const isInitiallyWorkingDay = this.isWorkingDay(currentDate);

        // Ajustar la fecha inicial hacia atrás si es necesario
        if (!isInitiallyInWorkingTime) {
            currentDate = this.adjustToWorkingTime(currentDate);
        }

        // Sumar días hábiles si es necesario
        if (params.days > 0) {
            currentDate = this.addWorkingDays(currentDate, params.days);

            // Mantener la hora ajustada después de sumar días
            // Si la fecha original estaba fuera del horario laboral, mantener la aproximación
            if (!isInitiallyInWorkingTime) {
                const originalDate = dayjs(params.startDate).tz(WORKING_CONFIG.timezone);
                const originalHour = originalDate.hour();
                const originalMinute = originalDate.minute();

                // Aplicar la misma lógica de aproximación al día final
                if (!isInitiallyWorkingDay) {
                    // Si empezó en día no laboral -> ir al final del día laboral (5 PM)
                    currentDate = currentDate
                        .hour(WORKING_CONFIG.hours.end)
                        .minute(0)
                        .second(0)
                        .millisecond(0);
                } else {
                    // Si empezó en día laboral pero fuera del horario -> mantener la aproximación
                    if (originalHour >= WORKING_CONFIG.hours.end) {
                        // Si era después de 5 PM, ir a las 5 PM
                        currentDate = currentDate
                            .hour(WORKING_CONFIG.hours.end)
                            .minute(0)
                            .second(0)
                            .millisecond(0);
                    } else if (originalHour < WORKING_CONFIG.hours.start) {
                        // Si era antes de 8 AM, ir a las 5 PM del día anterior al resultado
                        currentDate = holidayManager.getPreviousWorkingDay(currentDate)
                            .hour(WORKING_CONFIG.hours.end)
                            .minute(0)
                            .second(0)
                            .millisecond(0);
                    } else if (originalHour === WORKING_CONFIG.hours.lunchStart && originalMinute > 0) {
                        // Durante el almuerzo -> 12:00 PM
                        currentDate = currentDate
                            .hour(WORKING_CONFIG.hours.lunchStart)
                            .minute(0)
                            .second(0)
                            .millisecond(0);
                    } else if (originalHour > WORKING_CONFIG.hours.lunchStart && originalHour < WORKING_CONFIG.hours.lunchEnd) {
                        // Durante el almuerzo -> 12:00 PM
                        currentDate = currentDate
                            .hour(WORKING_CONFIG.hours.lunchStart)
                            .minute(0)
                            .second(0)
                            .millisecond(0);
                    }
                }
            }
        }

        // Sumar horas hábiles si es necesario
        if (params.hours > 0) {
            // Pasar información sobre si hubo aproximación inicial
            const wasAdjusted = !isInitiallyInWorkingTime;
            currentDate = this.addWorkingHours(currentDate, params.hours, wasAdjusted);
        }

        return currentDate.utc().toISOString();
    }

    // Verificar si una fecha está en horario laboral
    private isInWorkingTime(date: dayjs.Dayjs): boolean {
        // Verificar si es día laboral
        if (!holidayManager.isWorkingDay(date)) {
            return false;
        }

        const hour = date.hour();
        const minute = date.minute();

        // Verificar si está en horario laboral (8:00 AM - 5:00 PM, excluyendo almuerzo 12:00-1:00 PM)
        if (hour < WORKING_CONFIG.hours.start || hour >= WORKING_CONFIG.hours.end) {
            return false;
        }

        // Verificar si está en horario de almuerzo
        if (hour === WORKING_CONFIG.hours.lunchStart && minute > 0) {
            return false;
        }

        if (hour > WORKING_CONFIG.hours.lunchStart && hour < WORKING_CONFIG.hours.lunchEnd) {
            return false;
        }

        // Según la memoria: 1:00 PM exacto debe aproximarse hacia atrás a 12:00 PM
        if (hour === WORKING_CONFIG.hours.lunchEnd && minute === 0) {
            return false;
        }

        return true;
    }

    // Verificar si una fecha está en un día laboral (independientemente de la hora)
    private isWorkingDay(date: dayjs.Dayjs): boolean {
        return holidayManager.isWorkingDay(date);
    }

    // Ajustar una fecha al momento laboral más cercano hacia atrás
    private adjustToWorkingTime(date: dayjs.Dayjs): dayjs.Dayjs {
        let adjustedDate = date;

        // Si no es día laboral, mover al día laboral anterior a las 5:00 PM
        if (!holidayManager.isWorkingDay(adjustedDate)) {
            adjustedDate = holidayManager.getPreviousWorkingDay(adjustedDate)
                .hour(WORKING_CONFIG.hours.end)
                .minute(0)
                .second(0)
                .millisecond(0);
            return adjustedDate;
        }

        const hour = adjustedDate.hour();
        const minute = adjustedDate.minute();

        // Si es antes de las 8:00 AM, ajustar al día laboral anterior a las 5:00 PM
        if (hour < WORKING_CONFIG.hours.start) {
            adjustedDate = holidayManager.getPreviousWorkingDay(adjustedDate)
                .hour(WORKING_CONFIG.hours.end)
                .minute(0)
                .second(0)
                .millisecond(0);
            return adjustedDate;
        }

        // Si es después de las 5:00 PM, ajustar a las 5:00 PM del mismo día
        if (hour >= WORKING_CONFIG.hours.end) {
            return adjustedDate
                .hour(WORKING_CONFIG.hours.end)
                .minute(0)
                .second(0)
                .millisecond(0);
        }

        // Si es durante el almuerzo (12:00 PM - 1:00 PM), ajustar a las 12:00 PM
        if (hour === WORKING_CONFIG.hours.lunchStart && minute > 0) {
            return adjustedDate
                .hour(WORKING_CONFIG.hours.lunchStart)
                .minute(0)
                .second(0)
                .millisecond(0);
        }

        if (hour > WORKING_CONFIG.hours.lunchStart && hour < WORKING_CONFIG.hours.lunchEnd) {
            return adjustedDate
                .hour(WORKING_CONFIG.hours.lunchStart)
                .minute(0)
                .second(0)
                .millisecond(0);
        }

        // Si es exactamente 1:00 PM (justo después del almuerzo), aproximar hacia atrás a 12:00 PM
        if (hour === WORKING_CONFIG.hours.lunchEnd && minute === 0) {
            return adjustedDate
                .hour(WORKING_CONFIG.hours.lunchStart)
                .minute(0)
                .second(0)
                .millisecond(0);
        }

        // Si está en horario laboral válido, mantener la fecha actual
        return adjustedDate;
    }

    // Sumar días hábiles a una fecha
    private addWorkingDays(startDate: dayjs.Dayjs, days: number): dayjs.Dayjs {
        let currentDate = startDate;

        for (let i = 0; i < days; i++) {
            currentDate = holidayManager.getNextWorkingDay(currentDate);
        }

        return currentDate;
    }

    // Sumar horas hábiles a una fecha
    private addWorkingHours(startDate: dayjs.Dayjs, hours: number, wasAdjustedToWorkingTime: boolean = false): dayjs.Dayjs {
        let currentDate = startDate;
        let remainingHours = hours;

        while (remainingHours > 0) {
            // Asegurar que estamos en un día laboral y hora válida
            if (!this.isInWorkingTime(currentDate)) {
                currentDate = this.adjustToWorkingTime(currentDate);
            }

            const currentHour = currentDate.hour();
            const currentMinute = currentDate.minute();

            // Calcular cuántas horas podemos agregar en el día actual
            let hoursUntilLunch = 0;
            let hoursAfterLunch = 0;

            // Si estamos antes del almuerzo (incluyendo exactamente a las 12:00 PM)
            if (currentHour < WORKING_CONFIG.hours.lunchStart || (currentHour === WORKING_CONFIG.hours.lunchStart && currentMinute === 0)) {
                if (currentHour === WORKING_CONFIG.hours.lunchStart && currentMinute === 0) {
                    // Exactamente a las 12:00 PM - saltar directamente después del almuerzo
                    hoursUntilLunch = 0;
                } else {
                    hoursUntilLunch = WORKING_CONFIG.hours.lunchStart - currentHour - (currentMinute / 60);
                }
                // Calcular horas después del almuerzo
                hoursAfterLunch = WORKING_CONFIG.hours.end - WORKING_CONFIG.hours.lunchEnd;
            }
            // Si estamos después del almuerzo
            else if (currentHour >= WORKING_CONFIG.hours.lunchEnd) {
                hoursAfterLunch = WORKING_CONFIG.hours.end - currentHour - (currentMinute / 60);
            }

            const availableHoursToday = hoursUntilLunch + hoursAfterLunch;

            if (remainingHours <= availableHoursToday) {
                // Podemos completar las horas en el día actual
                currentDate = this.addHoursToWorkingDay(currentDate, remainingHours, wasAdjustedToWorkingTime);
                remainingHours = 0;
            } else {
                // Necesitamos continuar en el siguiente día laboral
                remainingHours -= availableHoursToday;
                currentDate = holidayManager.getNextWorkingDay(currentDate)
                    .hour(WORKING_CONFIG.hours.start)
                    .minute(0)
                    .second(0)
                    .millisecond(0);
            }
        }

        return currentDate;
    }

    // Agregar horas a un día laboral
    private addHoursToWorkingDay(date: dayjs.Dayjs, hours: number, wasAdjustedToWorkingTime: boolean = false): dayjs.Dayjs {
        let currentDate = date;
        let remainingHours = hours;

        const currentHour = currentDate.hour();
        const currentMinute = currentDate.minute();

        // Si estamos antes del almuerzo o exactamente a las 12:00 PM
        if (currentHour < WORKING_CONFIG.hours.lunchStart || (currentHour === WORKING_CONFIG.hours.lunchStart && currentMinute === 0)) {
            if (currentHour === WORKING_CONFIG.hours.lunchStart && currentMinute === 0) {
                // Exactamente a las 12:00 PM - saltar al final del almuerzo y agregar las horas
                currentDate = currentDate
                    .hour(WORKING_CONFIG.hours.lunchEnd)
                    .minute(0)
                    .second(0)
                    .millisecond(0);
            } else {
                const hoursUntilLunch = WORKING_CONFIG.hours.lunchStart - currentHour - (currentMinute / 60);

                if (remainingHours <= hoursUntilLunch) {
                    // Las horas caben antes del almuerzo
                    return currentDate.add(remainingHours * 60, 'minute');
                } else {
                    // Necesitamos pasar el almuerzo
                    remainingHours -= hoursUntilLunch;
                    currentDate = currentDate
                        .hour(WORKING_CONFIG.hours.lunchEnd)
                        .minute(0)
                        .second(0)
                        .millisecond(0);
                }
            }
        }

        // Agregar las horas restantes después del almuerzo
        return currentDate.add(remainingHours * 60, 'minute');
    }
}

export const dateService = new DateService();
