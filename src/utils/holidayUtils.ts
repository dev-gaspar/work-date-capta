import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { HolidayDate } from '../types';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * @class HolidayManager
 * @description
 * Clase encargada de gestionar días festivos y laborales.
 * 
 * - Carga los días festivos desde el archivo `WorkingDays.json`.
 * - Permite verificar si una fecha es festivo, fin de semana o día laboral.
 * - Calcula el siguiente o el anterior día laboral a partir de una fecha dada.
 */
export class HolidayManager {
    private holidays: Set<string> = new Set();
    private isLoaded: boolean = false;

    public loadHolidays(): void {
        try {
            // En entorno Lambda, el archivo estará en el directorio actual
            // En desarrollo local, estará en el directorio raíz del proyecto
            let holidaysPath = path.join(process.cwd(), 'WorkingDays.json');

            // Si no existe en el directorio actual, intentar en el directorio padre (para desarrollo local)
            if (!fs.existsSync(holidaysPath)) {
                holidaysPath = path.join(__dirname, '../../WorkingDays.json');
            }

            const holidaysData = fs.readFileSync(holidaysPath, 'utf-8');
            const holidaysList: HolidayDate[] = JSON.parse(holidaysData);

            this.holidays = new Set(holidaysList);
            this.isLoaded = true;

            console.log(`Cargados ${holidaysList.length} días festivos desde: ${holidaysPath}`);
        } catch (error) {
            console.error('Error cargando días festivos:', error);
            throw new Error('No se pudieron cargar los días festivos');
        }
    }

    /**
     * Verificar si una fecha es un día festivo
     * @param date - Fecha a verificar (en zona horaria de Colombia)
     * @returns true si es festivo, false en caso contrario
     */
    public isHoliday(date: dayjs.Dayjs): boolean {
        if (!this.isLoaded) {
            this.loadHolidays();
        }

        // Formatear la fecha como YYYY-MM-DD para comparar con los datos
        const dateString = date.format('YYYY-MM-DD');
        return this.holidays.has(dateString);
    }

    /**
     * Verificar si una fecha es fin de semana (sábado o domingo)
     * @param date - Fecha a verificar
     * @returns true si es fin de semana, false en caso contrario
     */
    public isWeekend(date: dayjs.Dayjs): boolean {
        const dayOfWeek = date.day(); // 0 = domingo, 6 = sábado
        return dayOfWeek === 0 || dayOfWeek === 6;
    }

    /**
     * Verificar si una fecha es un día laboral (no es fin de semana ni festivo)
     * @param date - Fecha a verificar (en zona horaria de Colombia)
     * @returns true si es día laboral, false en caso contrario
     */
    public isWorkingDay(date: dayjs.Dayjs): boolean {
        return !this.isWeekend(date) && !this.isHoliday(date);
    }

    /**
     * Obtener el siguiente día laboral a partir de una fecha dada
     * @param date - Fecha de inicio
     * @returns El siguiente día laboral
     */
    public getNextWorkingDay(date: dayjs.Dayjs): dayjs.Dayjs {
        let nextDay = date.add(1, 'day');

        while (!this.isWorkingDay(nextDay)) {
            nextDay = nextDay.add(1, 'day');
        }

        return nextDay;
    }

    /**
     * Obtener el día laboral anterior a partir de una fecha dada
     * @param date - Fecha de inicio
     * @returns El día laboral anterior
     */
    public getPreviousWorkingDay(date: dayjs.Dayjs): dayjs.Dayjs {
        let prevDay = date.subtract(1, 'day');

        while (!this.isWorkingDay(prevDay)) {
            prevDay = prevDay.subtract(1, 'day');
        }

        return prevDay;
    }
}

// Instancia singleton
export const holidayManager = new HolidayManager();
