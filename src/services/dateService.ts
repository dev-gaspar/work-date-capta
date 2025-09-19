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

        // Ajustar al siguiente momento laboral
        currentDate = this.adjustToWorkingTime(currentDate);

        // Sumar días hábiles
        if (params.days > 0) {
            currentDate = this.addWorkingDays(currentDate, params.days);
        }

        // Sumar horas hábiles
        if (params.hours > 0) {
            currentDate = this.addWorkingHours(currentDate, params.hours);
        }

        return currentDate.utc().toISOString();
    }

    // Ajustar una fecha al siguiente momento laboral
    private adjustToWorkingTime(date: dayjs.Dayjs): dayjs.Dayjs {
        let adjustedDate = date;

        // Si no es día laboral, mover al siguiente día laboral a las 8:00 AM
        if (!holidayManager.isWorkingDay(adjustedDate)) {
            adjustedDate = holidayManager.getNextWorkingDay(adjustedDate)
                .hour(WORKING_CONFIG.hours.start)
                .minute(0)
                .second(0)
                .millisecond(0);
            return adjustedDate;
        }

        const hour = adjustedDate.hour();
        const minute = adjustedDate.minute();

        // Si es antes de las 8:00 AM, ajustar a las 8:00 AM
        if (hour < WORKING_CONFIG.hours.start) {
            return adjustedDate
                .hour(WORKING_CONFIG.hours.start)
                .minute(0)
                .second(0)
                .millisecond(0);
        }

        // Si es después de las 5:00 PM, mover al siguiente día laboral a las 8:00 AM
        if (hour >= WORKING_CONFIG.hours.end) {
            adjustedDate = holidayManager.getNextWorkingDay(adjustedDate)
                .hour(WORKING_CONFIG.hours.start)
                .minute(0)
                .second(0)
                .millisecond(0);
            return adjustedDate;
        }

        // Si es durante el almuerzo (12:00 PM - 1:00 PM), ajustar a la 1:00 PM
        if (hour === WORKING_CONFIG.hours.lunchStart ||
            (hour === WORKING_CONFIG.hours.lunchStart && minute >= 0 && hour < WORKING_CONFIG.hours.lunchEnd)) {
            return adjustedDate
                .hour(WORKING_CONFIG.hours.lunchEnd)
                .minute(0)
                .second(0)
                .millisecond(0);
        }

        // Si está en horario laboral, mantener la fecha actual
        return adjustedDate;
    }

    // Sumar días hábiles a una fecha
    private addWorkingDays(startDate: dayjs.Dayjs, days: number): dayjs.Dayjs {
        let currentDate = startDate;
        let addedDays = 0;

        while (addedDays < days) {
            currentDate = currentDate.add(1, 'day');

            // Solo contar si es día laboral
            if (holidayManager.isWorkingDay(currentDate)) {
                addedDays++;
            }
        }

        return currentDate;
    }

    // Sumar horas hábiles a una fecha
    private addWorkingHours(startDate: dayjs.Dayjs, hours: number): dayjs.Dayjs {
        let currentDate = startDate;
        let remainingHours = hours;

        while (remainingHours > 0) {
            // Asegurar que estamos en un día laboral y hora válida
            currentDate = this.adjustToWorkingTime(currentDate);

            const currentHour = currentDate.hour();
            const currentMinute = currentDate.minute();

            // Calcular cuántas horas podemos agregar en el día actual
            let hoursUntilLunch = 0;
            let hoursAfterLunch = 0;

            // Si estamos antes del almuerzo
            if (currentHour < WORKING_CONFIG.hours.lunchStart) {
                hoursUntilLunch = WORKING_CONFIG.hours.lunchStart - currentHour - (currentMinute / 60);
            }

            // Si estamos después del almuerzo
            if (currentHour >= WORKING_CONFIG.hours.lunchEnd) {
                hoursAfterLunch = WORKING_CONFIG.hours.end - currentHour - (currentMinute / 60);
            } else if (currentHour < WORKING_CONFIG.hours.lunchStart) {
                // Si estamos antes del almuerzo, calcular horas después del almuerzo también
                hoursAfterLunch = WORKING_CONFIG.hours.end - WORKING_CONFIG.hours.lunchEnd;
            }

            const availableHoursToday = hoursUntilLunch + hoursAfterLunch;

            if (remainingHours <= availableHoursToday) {
                // Podemos completar las horas en el día actual
                currentDate = this.addHoursToWorkingDay(currentDate, remainingHours);
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
    private addHoursToWorkingDay(date: dayjs.Dayjs, hours: number): dayjs.Dayjs {
        let currentDate = date;
        let remainingHours = hours;

        const currentHour = currentDate.hour();
        const currentMinute = currentDate.minute();

        // Si estamos antes del almuerzo
        if (currentHour < WORKING_CONFIG.hours.lunchStart) {
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

        // Agregar las horas restantes después del almuerzo
        return currentDate.add(remainingHours * 60, 'minute');
    }
}

export const dateService = new DateService();
