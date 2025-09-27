import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import { dateService } from '../src/services/dateService';
import { ProcessedParams } from '../src/types';

dayjs.extend(utc);
dayjs.extend(timezone);

describe('DateService - Ejemplos de prueba técnica', () => {

    const createParams = (days: number, hours: number, dateString: string): ProcessedParams => ({
        days,
        hours,
        startDate: dayjs(dateString).toDate()
    });

    describe('Ejemplos específicos de la prueba técnica', () => {

        test('Ejemplo 1: Viernes 5:00 PM + 1 hora = Lunes 9:00 AM', () => {
            // Viernes 17 de enero de 2025 a las 5:00 PM Colombia (22:00 UTC)
            const params = createParams(0, 1, '2025-01-17T22:00:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ser lunes 20 de enero a las 9:00 AM Colombia (14:00 UTC)
            const expectedDate = dayjs('2025-01-20T14:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Ejemplo 2: Sábado 2:00 PM + 1 hora = Lunes 9:00 AM', () => {
            // Sábado 18 de enero de 2025 a las 2:00 PM Colombia (19:00 UTC)
            const params = createParams(0, 1, '2025-01-18T19:00:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ser lunes 20 de enero a las 9:00 AM Colombia (14:00 UTC)
            const expectedDate = dayjs('2025-01-20T14:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Ejemplo 3: Martes 3:00 PM + 1 día + 4 horas = Jueves 10:00 AM', () => {
            // Martes 21 de enero de 2025 a las 3:00 PM Colombia (20:00 UTC)
            const params = createParams(1, 4, '2025-01-21T20:00:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ser jueves 23 de enero a las 10:00 AM Colombia (15:00 UTC)
            const expectedDate = dayjs('2025-01-23T15:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Ejemplo 4: Domingo 6:00 PM + 1 día = Lunes 5:00 PM', () => {
            // Domingo 9 de febrero de 2025 a las 6:00 PM Colombia (23:00 UTC) - evitando festivos de enero
            const params = createParams(1, 0, '2025-02-09T23:00:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ser lunes 10 de febrero a las 5:00 PM Colombia (22:00 UTC)
            const expectedDate = dayjs('2025-02-10T22:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Ejemplo 5: Día laboral 8:00 AM + 8 horas = Mismo día 5:00 PM', () => {
            // Lunes 20 de enero de 2025 a las 8:00 AM Colombia (13:00 UTC)
            const params = createParams(0, 8, '2025-01-20T13:00:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ser el mismo día a las 5:00 PM Colombia (22:00 UTC)
            const expectedDate = dayjs('2025-01-20T22:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Ejemplo 6: Día laboral 8:00 AM + 1 día = Siguiente día laboral 8:00 AM', () => {
            // Lunes 20 de enero de 2025 a las 8:00 AM Colombia (13:00 UTC)
            const params = createParams(1, 0, '2025-01-20T13:00:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ser martes 21 de enero a las 8:00 AM Colombia (13:00 UTC)
            const expectedDate = dayjs('2025-01-21T13:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Ejemplo 7: Día laboral 12:30 PM + 1 día = Siguiente día laboral 12:00 PM', () => {
            // Lunes 20 de enero de 2025 a las 12:30 PM Colombia (17:30 UTC)
            const params = createParams(1, 0, '2025-01-20T17:30:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ser martes 21 de enero a las 12:00 PM Colombia (17:00 UTC) porque se aproxima hacia atrás
            const expectedDate = dayjs('2025-01-21T17:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Ejemplo 8: Día laboral 11:30 AM + 3 horas = Mismo día 3:30 PM', () => {
            // Lunes 20 de enero de 2025 a las 11:30 AM Colombia (16:30 UTC)
            const params = createParams(0, 3, '2025-01-20T16:30:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ser el mismo día a las 3:30 PM Colombia (20:30 UTC)
            // 30 min hasta almuerzo + 2.5 horas después del almuerzo = 3:30 PM
            const expectedDate = dayjs('2025-01-20T20:30:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Ejemplo 9: 10 abril 2025 15:00 UTC + 5 días + 4 horas (con festivos 17-18 abril)', () => {
            // 10 de abril de 2025 a las 3:00 PM UTC (10:00 AM Colombia)
            const params = createParams(5, 4, '2025-04-10T15:00:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // 17 y 18 de abril son festivos, debería ser 21 de abril a las 3:00 PM Colombia (20:00 UTC)
            const expectedDate = dayjs('2025-04-21T20:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });
    });

    describe('Casos edge adicionales', () => {

        test('Durante horario de almuerzo debe ajustarse hacia atrás a 12:00 PM', () => {
            // Lunes a las 12:30 PM Colombia (17:30 UTC)
            const params = createParams(0, 1, '2025-01-20T17:30:00.000Z');
            const result = dateService.calculateWorkingDate(params);

            // Debería ajustarse hacia atrás a 12:00 PM y agregar 1 hora = 2:00 PM Colombia (19:00 UTC)
            const expectedDate = dayjs('2025-01-20T19:00:00.000Z');
            const resultDate = dayjs(result);

            expect(resultDate.isSame(expectedDate, 'minute')).toBe(true);
        });

        test('Múltiples días con festivos en el medio', () => {
            // Día laboral en febrero para sumar 2 días (evitando festivos de enero)
            const params = createParams(2, 0, '2025-02-03T13:00:00.000Z'); // 3 febrero 8:00 AM Colombia (lunes)
            const result = dateService.calculateWorkingDate(params);

            // Debería ir 2 días laborales adelante: martes 4 febrero + miércoles 5 febrero
            const resultDate = dayjs(result);
            expect(resultDate.format('YYYY-MM-DD')).toBe('2025-02-05'); // 5 febrero (miércoles)
        });
    });
});
