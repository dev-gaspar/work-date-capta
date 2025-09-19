import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { holidayManager } from '../src/utils/holidayUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('HolidayManager', () => {

    beforeAll(() => {
        holidayManager.loadHolidays();
    });

    describe('isHoliday', () => {
        test('debería detectar días festivos de Colombia 2025', () => {
            // 1 de enero de 2025 (Año Nuevo)
            const newYear = dayjs('2025-01-01').tz('America/Bogota');
            expect(holidayManager.isHoliday(newYear)).toBe(true);

            // 6 de enero de 2025 (Día de los Reyes Magos)
            const epiphany = dayjs('2025-01-06').tz('America/Bogota');
            expect(holidayManager.isHoliday(epiphany)).toBe(true);

            // 17 de abril de 2025 (Jueves Santo)
            const holyThursday = dayjs('2025-04-17').tz('America/Bogota');
            expect(holidayManager.isHoliday(holyThursday)).toBe(true);

            // 18 de abril de 2025 (Viernes Santo)
            const goodFriday = dayjs('2025-04-18').tz('America/Bogota');
            expect(holidayManager.isHoliday(goodFriday)).toBe(true);

            // 25 de diciembre de 2025 (Navidad)
            const christmas = dayjs('2025-12-25').tz('America/Bogota');
            expect(holidayManager.isHoliday(christmas)).toBe(true);
        });

        test('debería retornar false para días no festivos', () => {
            // 15 de enero de 2025 (día normal)
            const normalDay = dayjs('2025-01-15').tz('America/Bogota');
            expect(holidayManager.isHoliday(normalDay)).toBe(false);

            // 20 de enero de 2025 (lunes normal)
            const monday = dayjs('2025-01-20').tz('America/Bogota');
            expect(holidayManager.isHoliday(monday)).toBe(false);
        });
    });

    describe('isWeekend', () => {
        test('debería detectar fines de semana', () => {
            const saturday = dayjs('2025-01-18').tz('America/Bogota');
            expect(holidayManager.isWeekend(saturday)).toBe(true);

            const sunday = dayjs('2025-01-19').tz('America/Bogota');
            expect(holidayManager.isWeekend(sunday)).toBe(true);
        });

        test('debería retornar false para días laborales', () => {
            const monday = dayjs('2025-01-20').tz('America/Bogota');
            expect(holidayManager.isWeekend(monday)).toBe(false);

            const friday = dayjs('2025-01-24').tz('America/Bogota');
            expect(holidayManager.isWeekend(friday)).toBe(false);
        });
    });

    describe('isWorkingDay', () => {
        test('debería detectar días laborales válidos', () => {
            const monday = dayjs('2025-01-20').tz('America/Bogota');
            expect(holidayManager.isWorkingDay(monday)).toBe(true);

            const tuesday = dayjs('2025-01-21').tz('America/Bogota');
            expect(holidayManager.isWorkingDay(tuesday)).toBe(true);

            const friday = dayjs('2025-01-24').tz('America/Bogota');
            expect(holidayManager.isWorkingDay(friday)).toBe(true);
        });

        test('debería retornar false para fines de semana', () => {
            const saturday = dayjs('2025-01-18').tz('America/Bogota');
            expect(holidayManager.isWorkingDay(saturday)).toBe(false);

            const sunday = dayjs('2025-01-19').tz('America/Bogota');
            expect(holidayManager.isWorkingDay(sunday)).toBe(false);
        });

        test('debería retornar false para días festivos', () => {
            // 1 de enero de 2025 (miércoles festivo)
            const newYear = dayjs('2025-01-01').tz('America/Bogota');
            expect(holidayManager.isWorkingDay(newYear)).toBe(false);

            // 6 de enero de 2025 (lunes festivo)
            const epiphany = dayjs('2025-01-06').tz('America/Bogota');
            expect(holidayManager.isWorkingDay(epiphany)).toBe(false);
        });
    });

    describe('getNextWorkingDay', () => {
        test('debería encontrar el siguiente día laboral después de viernes', () => {
            // Viernes 17 de enero de 2025
            const friday = dayjs('2025-01-17').tz('America/Bogota');
            const nextWorkingDay = holidayManager.getNextWorkingDay(friday);

            // Debería ser lunes 20 de enero
            expect(nextWorkingDay.format('YYYY-MM-DD')).toBe('2025-01-20');
            expect(nextWorkingDay.day()).toBe(1); // Lunes
        });

        test('debería saltar festivos para encontrar el siguiente día laboral', () => {
            // 31 de diciembre de 2024 (martes)
            const tuesday = dayjs('2024-12-31').tz('America/Bogota');
            const nextWorkingDay = holidayManager.getNextWorkingDay(tuesday);

            // Debería saltar el 1 de enero de 2025 (festivo) y ir al 2 de enero
            expect(nextWorkingDay.format('YYYY-MM-DD')).toBe('2025-01-02');
        });

        test('debería manejar múltiples días no laborales consecutivos', () => {
            // Jueves 16 de abril de 2025 (antes de Jueves y Viernes Santo)
            const thursday = dayjs('2025-04-16').tz('America/Bogota');
            const nextWorkingDay = holidayManager.getNextWorkingDay(thursday);

            // Debería saltar 17, 18 (festivos), 19, 20 (fin de semana) y ir al 21
            expect(nextWorkingDay.format('YYYY-MM-DD')).toBe('2025-04-21');
            expect(nextWorkingDay.day()).toBe(1); // Lunes
        });
    });

    describe('getPreviousWorkingDay', () => {
        test('debería encontrar el día laboral anterior después de lunes', () => {
            // Lunes 20 de enero de 2025
            const monday = dayjs('2025-01-20').tz('America/Bogota');
            const prevWorkingDay = holidayManager.getPreviousWorkingDay(monday);

            // Debería ser viernes 17 de enero
            expect(prevWorkingDay.format('YYYY-MM-DD')).toBe('2025-01-17');
            expect(prevWorkingDay.day()).toBe(5); // Viernes
        });

        test('debería saltar festivos para encontrar el día laboral anterior', () => {
            // 2 de enero de 2025 (jueves, después del festivo)
            const thursday = dayjs('2025-01-02').tz('America/Bogota');
            const prevWorkingDay = holidayManager.getPreviousWorkingDay(thursday);

            // Debería saltar el 1 de enero (festivo) y ir al 31 de diciembre de 2024
            expect(prevWorkingDay.format('YYYY-MM-DD')).toBe('2024-12-31');
        });
    });
});
