import app from './app';
import { holidayManager } from './utils/holidayUtils';

const PORT = process.env.PORT || 3000;

async function startServer(): Promise<void> {
    try {
        console.log('Cargando días festivos...');
        holidayManager.loadHolidays();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`📅 API de fechas hábiles disponible en:`);
            console.log(`   http://localhost:${PORT}/`);
            console.log(`   http://localhost:${PORT}/work-date`);
            console.log(`   http://localhost:${PORT}/health`);
            console.log('');
            console.log('📋 Ejemplos de uso:');
            console.log(`   http://localhost:${PORT}/work-date?days=1&hours=4`);
            console.log(`   http://localhost:${PORT}/work-date?hours=8`);
            console.log(`   http://localhost:${PORT}/work-date?date=2025-04-10T15:00:00.000Z&days=5&hours=4`);
        });

    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}


// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
    console.log('SIGTERM recibido, cerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recibido, cerrando servidor...');
    process.exit(0);
});

startServer();
