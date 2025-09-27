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

const MINUTES_PER_HOUR = 60;
const ZERO_MINUTES = 0;
const ZERO_SECONDS = 0;
const ZERO_MILLISECONDS = 0;

type TimeOfDay = 'before-work' | 'morning' | 'lunch' | 'afternoon' | 'after-work';
type DateAdjustment = {
    hour: number;
    minute: number;
    isPreviousDay?: boolean;
};

export class DateService {
    private readonly config = WORKING_CONFIG;

    // Calcula la fecha hábil resultante después de sumar días y horas
    public calculateWorkingDate(params: ProcessedParams): string {
        const startDate = this.toTimezone(params.startDate);
        const initialState = this.getDateState(startDate);

        let resultDate = initialState.isWorkingTime
            ? startDate
            : this.adjustToWorkingTime(startDate);

        if (params.days > 0) {
            resultDate = this.addWorkingDays(resultDate, params.days);
            resultDate = this.preserveTimeAdjustment(resultDate, startDate, initialState);
        }

        if (params.hours > 0) {
            resultDate = this.addWorkingHours(
                resultDate,
                params.hours,
                !initialState.isWorkingTime
            );
        }

        return resultDate.utc().toISOString();
    }

    // Obtiene el estado de una fecha en relación al horario laboral
    private getDateState(date: dayjs.Dayjs) {
        return {
            isWorkingDay: this.isWorkingDay(date),
            isWorkingTime: this.isInWorkingTime(date),
            timeOfDay: this.getTimeOfDay(date)
        };
    }

    // Preserva el ajuste de tiempo después de sumar días
    private preserveTimeAdjustment(
        currentDate: dayjs.Dayjs,
        originalDate: dayjs.Dayjs,
        initialState: ReturnType<typeof this.getDateState>
    ): dayjs.Dayjs {
        if (initialState.isWorkingTime) {
            return currentDate;
        }

        const adjustment = this.getTimeAdjustment(originalDate, initialState);

        if (adjustment.isPreviousDay) {
            currentDate = holidayManager.getPreviousWorkingDay(currentDate);
        }

        return this.setTime(currentDate, adjustment.hour, adjustment.minute);
    }

    // Determina el ajuste de tiempo necesario basado en el estado inicial
    private getTimeAdjustment(
        date: dayjs.Dayjs,
        state: ReturnType<typeof this.getDateState>
    ): DateAdjustment {
        if (!state.isWorkingDay) {
            return { hour: this.config.hours.end, minute: ZERO_MINUTES };
        }

        switch (state.timeOfDay) {
            case 'before-work':
                return {
                    hour: this.config.hours.end,
                    minute: ZERO_MINUTES,
                    isPreviousDay: true
                };
            case 'after-work':
                return { hour: this.config.hours.end, minute: ZERO_MINUTES };
            case 'lunch':
                return { hour: this.config.hours.lunchStart, minute: ZERO_MINUTES };
            default:
                return { hour: date.hour(), minute: date.minute() };
        }
    }

    // Determina en qué momento del día se encuentra una fecha
    private getTimeOfDay(date: dayjs.Dayjs): TimeOfDay {
        const hour = date.hour();
        const minute = date.minute();

        if (hour < this.config.hours.start) {
            return 'before-work';
        }

        if (hour >= this.config.hours.end) {
            return 'after-work';
        }

        if (this.isLunchTime(hour, minute)) {
            return 'lunch';
        }

        if (hour < this.config.hours.lunchStart) {
            return 'morning';
        }

        return 'afternoon';
    }

    // Verifica si es horario de almuerzo
    private isLunchTime(hour: number, minute: number): boolean {
        // Durante el almuerzo
        if (hour > this.config.hours.lunchStart && hour < this.config.hours.lunchEnd) {
            return true;
        }

        // Después de las 12:00 PM pero dentro de la hora 12
        if (hour === this.config.hours.lunchStart && minute > 0) {
            return true;
        }

        // Exactamente a la 1:00 PM se considera almuerzo
        if (hour === this.config.hours.lunchEnd && minute === 0) {
            return true;
        }

        return false;
    }

    // Verifica si una fecha está en horario laboral
    private isInWorkingTime(date: dayjs.Dayjs): boolean {
        if (!holidayManager.isWorkingDay(date)) {
            return false;
        }

        const timeOfDay = this.getTimeOfDay(date);
        return timeOfDay === 'morning' || timeOfDay === 'afternoon';
    }

    // Verifica si es día laboral
    private isWorkingDay(date: dayjs.Dayjs): boolean {
        return holidayManager.isWorkingDay(date);
    }

    // Ajusta una fecha al momento laboral más cercano hacia atrás
    private adjustToWorkingTime(date: dayjs.Dayjs): dayjs.Dayjs {
        if (!this.isWorkingDay(date)) {
            return this.setEndOfWorkDay(
                holidayManager.getPreviousWorkingDay(date)
            );
        }

        const timeOfDay = this.getTimeOfDay(date);

        switch (timeOfDay) {
            case 'before-work':
                return this.setEndOfWorkDay(
                    holidayManager.getPreviousWorkingDay(date)
                );

            case 'after-work':
                return this.setEndOfWorkDay(date);

            case 'lunch':
                return this.setTime(date, this.config.hours.lunchStart, ZERO_MINUTES);

            default:
                return date;
        }
    }

    // Suma días hábiles a una fecha
    private addWorkingDays(startDate: dayjs.Dayjs, days: number): dayjs.Dayjs {
        let currentDate = startDate;

        for (let i = 0; i < days; i++) {
            currentDate = holidayManager.getNextWorkingDay(currentDate);
        }

        return currentDate;
    }

    // Suma horas hábiles a una fecha
    private addWorkingHours(
        startDate: dayjs.Dayjs,
        hours: number,
        wasAdjusted: boolean = false
    ): dayjs.Dayjs {
        let currentDate = startDate;
        let remainingHours = hours;

        while (remainingHours > 0) {
            if (!this.isInWorkingTime(currentDate)) {
                currentDate = this.adjustToWorkingTime(currentDate);
            }

            const availableHours = this.calculateAvailableHours(currentDate);

            if (remainingHours <= availableHours) {
                return this.addHoursWithinDay(currentDate, remainingHours);
            }

            remainingHours -= availableHours;
            currentDate = this.setStartOfWorkDay(
                holidayManager.getNextWorkingDay(currentDate)
            );
        }

        return currentDate;
    }

    // Calcula las horas disponibles en el día actual
    private calculateAvailableHours(date: dayjs.Dayjs): number {
        const hour = date.hour();
        const minute = date.minute();
        const minuteFraction = minute / MINUTES_PER_HOUR;

        // Si estamos exactamente a las 12:00 PM
        if (hour === this.config.hours.lunchStart && minute === 0) {
            return this.config.hours.end - this.config.hours.lunchEnd;
        }

        // Si estamos antes del almuerzo
        if (hour < this.config.hours.lunchStart) {
            const hoursUntilLunch = this.config.hours.lunchStart - hour - minuteFraction;
            const hoursAfterLunch = this.config.hours.end - this.config.hours.lunchEnd;
            return hoursUntilLunch + hoursAfterLunch;
        }

        // Si estamos después del almuerzo
        return this.config.hours.end - hour - minuteFraction;
    }

    // Agrega horas dentro del mismo día laboral
    private addHoursWithinDay(date: dayjs.Dayjs, hours: number): dayjs.Dayjs {
        const hour = date.hour();
        const minute = date.minute();

        // Si estamos exactamente a las 12:00 PM, saltar al final del almuerzo
        if (hour === this.config.hours.lunchStart && minute === 0) {
            return date
                .hour(this.config.hours.lunchEnd)
                .add(hours * MINUTES_PER_HOUR, 'minute');
        }

        // Si estamos antes del almuerzo
        if (hour < this.config.hours.lunchStart) {
            const hoursUntilLunch = this.config.hours.lunchStart - hour - (minute / MINUTES_PER_HOUR);

            if (hours <= hoursUntilLunch) {
                return date.add(hours * MINUTES_PER_HOUR, 'minute');
            }

            // Saltar el almuerzo y continuar
            const remainingHours = hours - hoursUntilLunch;
            return date
                .hour(this.config.hours.lunchEnd)
                .minute(ZERO_MINUTES)
                .add(remainingHours * MINUTES_PER_HOUR, 'minute');
        }

        // Si estamos después del almuerzo
        return date.add(hours * MINUTES_PER_HOUR, 'minute');
    }

    // Métodos auxiliares para mejorar legibilidad
    private toTimezone(date: string | Date): dayjs.Dayjs {
        return dayjs(date).tz(this.config.timezone);
    }

    private setTime(date: dayjs.Dayjs, hour: number, minute: number): dayjs.Dayjs {
        return date
            .hour(hour)
            .minute(minute)
            .second(ZERO_SECONDS)
            .millisecond(ZERO_MILLISECONDS);
    }

    private setStartOfWorkDay(date: dayjs.Dayjs): dayjs.Dayjs {
        return this.setTime(date, this.config.hours.start, ZERO_MINUTES);
    }

    private setEndOfWorkDay(date: dayjs.Dayjs): dayjs.Dayjs {
        return this.setTime(date, this.config.hours.end, ZERO_MINUTES);
    }
}

export const dateService = new DateService();