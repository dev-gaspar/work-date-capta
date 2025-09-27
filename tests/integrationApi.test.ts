import axios, { AxiosError } from 'axios';

const API_BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

interface ApiResponse {
    date: string;
}

interface TestCase {
    description: string;
    params: {
        date?: string;
        days?: number;
        hours?: number;
    };
    expected: string;
    notes?: string;
}

describe('API Integration Tests - Fechas Hábiles', () => {

    beforeAll(async () => {
        // Verificar que la API esté corriendo
        try {
            await axios.get(`${API_BASE_URL}/health`);
            console.log('✅ API está corriendo correctamente');
        } catch (error) {
            console.error('❌ Error: La API no está corriendo en el puerto 3000');
            console.error('Por favor, ejecuta: npm run dev');
            throw new Error('API no disponible');
        }
    });

    const testCases: TestCase[] = [
        {
            description: '1. Viernes 5:00 PM + 1 hora → Lunes 9:00 AM (Colombia)',
            params: {
                date: '2025-01-17T22:00:00.000Z', // Viernes 5:00 PM Colombia
                hours: 1
            },
            expected: '2025-01-20T14:00:00.000Z', // Lunes 9:00 AM Colombia
            notes: 'Viernes fuera de horario laboral debe aproximarse al siguiente día hábil'
        },
        {
            description: '2. Sábado 2:00 PM + 1 hora → Lunes 9:00 AM (Colombia)',
            params: {
                date: '2025-01-18T19:00:00.000Z', // Sábado 2:00 PM Colombia
                hours: 1
            },
            expected: '2025-01-20T14:00:00.000Z', // Lunes 9:00 AM Colombia
            notes: 'Fin de semana debe aproximarse al siguiente día hábil'
        },
        {
            description: '3. Martes 3:00 PM + 1 día + 4 horas → Jueves 10:00 AM (Colombia)',
            params: {
                date: '2025-01-14T20:00:00.000Z', // Martes 3:00 PM Colombia
                days: 1,
                hours: 4
            },
            expected: '2025-01-16T15:00:00.000Z', // Jueves 10:00 AM Colombia
            notes: 'Combinación de días y horas'
        },
        {
            description: '4. Domingo 6:00 PM + 1 día → Lunes 5:00 PM (Colombia)',
            params: {
                date: '2025-01-19T23:00:00.000Z', // Domingo 6:00 PM Colombia
                days: 1
            },
            expected: '2025-01-20T22:00:00.000Z', // Lunes 5:00 PM Colombia
            notes: 'Domingo debe aproximarse a lunes y sumar 1 día completo'
        },
        {
            description: '5. Día laboral 8:00 AM + 8 horas → Mismo día 5:00 PM (Colombia)',
            params: {
                date: '2025-01-14T13:00:00.000Z', // Martes 8:00 AM Colombia
                hours: 8
            },
            expected: '2025-01-14T22:00:00.000Z', // Martes 5:00 PM Colombia
            notes: '8 horas laborales en un día'
        },
        {
            description: '6. Día laboral 8:00 AM + 1 día → Siguiente día laboral 8:00 AM (Colombia)',
            params: {
                date: '2025-01-14T13:00:00.000Z', // Martes 8:00 AM Colombia
                days: 1
            },
            expected: '2025-01-15T13:00:00.000Z', // Miércoles 8:00 AM Colombia
            notes: 'Un día laboral completo'
        },
        {
            description: '7. Día laboral 12:30 PM + 1 día → Siguiente día laboral 12:00 PM (Colombia)',
            params: {
                date: '2025-01-14T17:30:00.000Z', // Martes 12:30 PM Colombia
                days: 1
            },
            expected: '2025-01-15T17:00:00.000Z', // Miércoles 12:00 PM Colombia
            notes: 'Debe aproximar hacia atrás a 12:00 PM (antes del almuerzo)'
        },
        {
            description: '8. Día laboral 11:30 AM + 3 horas → Mismo día 3:30 PM (Colombia)',
            params: {
                date: '2025-09-25T16:30:00.000Z', // Miércoles 11:30 AM Colombia
                hours: 3
            },
            expected: '2025-09-25T20:30:00.000Z', // Miércoles 3:30 PM Colombia
            notes: 'Hora nocturna debe aproximarse hacia atrás al día laboral'
        },
        {
            description: '9. 10 abril 2025 + 5 días + 4 horas → 21 abril 3:00 PM (con festivos)',
            params: {
                date: '2025-04-10T15:00:00.000Z', // 10 abril 2025
                days: 5,
                hours: 4
            },
            expected: '2025-04-21T20:00:00.000Z', // 21 abril 3:00 PM Colombia
            notes: 'Debe saltar festivos del 17 y 18 de abril'
        }
    ];

    // Casos específicos de aproximación mencionados en las memorias
    const approximationTestCases: TestCase[] = [
        {
            description: 'Aproximación almuerzo: 1:00 PM debe aproximarse a 12:00 PM',
            params: {
                date: '2025-01-14T18:00:00.000Z', // Martes 1:00 PM Colombia (después del almuerzo)
                hours: 1
            },
            expected: '2025-01-14T19:00:00.000Z', // Debe aproximar a 12:00 PM y sumar 1 hora = 2:00 PM
            notes: 'La aproximación hacia atrás debe funcionar correctamente para horario de almuerzo'
        },
        {
            description: 'Aproximación fin de día: 16 abril 10:00 PM + 1 día → 21 abril 5:00 PM',
            params: {
                date: '2025-04-16T22:00:00.000Z', // 16 abril 10:00 PM Colombia
                days: 1
            },
            expected: '2025-04-21T22:00:00.000Z', // 21 abril 5:00 PM Colombia
            notes: 'Debe aproximarse al final del día correcto, no al inicio del siguiente'
        }
    ];

    // Ejecutar casos de test principales
    testCases.forEach((testCase, index) => {
        test(testCase.description, async () => {
            const params = new URLSearchParams();

            if (testCase.params.date) params.append('date', testCase.params.date);
            if (testCase.params.days) params.append('days', testCase.params.days.toString());
            if (testCase.params.hours) params.append('hours', testCase.params.hours.toString());

            try {
                const response = await axios.get(`${API_BASE_URL}/work-date?${params.toString()}`);
                const result: ApiResponse = response.data;

                console.log(`\n📋 Test ${index + 1}: ${testCase.description}`);
                console.log(`📥 Input: ${JSON.stringify(testCase.params)}`);
                console.log(`✅ Esperado: ${testCase.expected}`);
                console.log(`📤 Actual: ${result.date}`);
                console.log(`📝 Notas: ${testCase.notes}`);

                expect(result.date).toBe(testCase.expected);
            } catch (error) {
                console.error(`❌ Error en test ${index + 1}:`, error);
                throw error;
            }
        });
    });

    // Ejecutar casos de aproximación específicos
    describe('Casos de Aproximación Específicos', () => {
        approximationTestCases.forEach((testCase, index) => {
            test(testCase.description, async () => {
                const params = new URLSearchParams();

                if (testCase.params.date) params.append('date', testCase.params.date);
                if (testCase.params.days) params.append('days', testCase.params.days.toString());
                if (testCase.params.hours) params.append('hours', testCase.params.hours.toString());

                try {
                    const response = await axios.get(`${API_BASE_URL}/work-date?${params.toString()}`);
                    const result: ApiResponse = response.data;

                    console.log(`\n🔍 Test Aproximación ${index + 1}: ${testCase.description}`);
                    console.log(`📥 Input: ${JSON.stringify(testCase.params)}`);
                    console.log(`✅ Esperado: ${testCase.expected}`);
                    console.log(`📤 Actual: ${result.date}`);
                    console.log(`📝 Notas: ${testCase.notes}`);

                    expect(result.date).toBe(testCase.expected);
                } catch (error) {
                    console.error(`❌ Error en test de aproximación ${index + 1}:`, error);
                    throw error;
                }
            });
        });
    });

    // Test de validación de errores
    describe('Validación de Errores', () => {
        test('Debe retornar error cuando no se proporcionan parámetros', async () => {
            try {
                await axios.get(`${API_BASE_URL}/work-date`);
                fail('Debería haber lanzado un error');
            } catch (error) {
                const axiosError = error as AxiosError;
                expect(axiosError.response?.status).toBe(400);
            }
        });

        test('Debe retornar error con formato de fecha inválido', async () => {
            try {
                await axios.get(`${API_BASE_URL}/work-date?date=invalid-date&hours=1`);
                fail('Debería haber lanzado un error');
            } catch (error) {
                const axiosError = error as AxiosError;
                expect(axiosError.response?.status).toBe(400);
            }
        });

        test('Debe retornar error con valores negativos', async () => {
            try {
                await axios.get(`${API_BASE_URL}/work-date?days=-1`);
                fail('Debería haber lanzado un error');
            } catch (error) {
                const axiosError = error as AxiosError;
                expect(axiosError.response?.status).toBe(400);
            }
        });
    });

    // Test de salud de la API
    test('Health check debe funcionar correctamente', async () => {
        const response = await axios.get(`${API_BASE_URL}/health`);
        expect(response.status).toBe(200);
        expect(response.data.status).toBe('OK');
    });
});
