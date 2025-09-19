import express, { Application, Request, Response } from 'express';
import { dateController } from './controllers/dateController';
import { corsMiddleware, globalErrorHandler, notFoundHandler } from './middleware';

export class App {
    public app: Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares(): void {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(corsMiddleware);
    }

    private initializeRoutes(): void {
        this.app.get('/work-date', (req: Request, res: Response) => {
            dateController.calculateWorkingDate(req, res);
        });

        this.app.get('/health', (req: Request, res: Response) => {
            res.status(200).json({
                status: 'OK',
                message: 'API de fechas hábiles funcionando correctamente',
                timestamp: new Date().toISOString()
            });
        });

        this.app.get('/', (req: Request, res: Response) => {
            res.status(200).json({
                message: 'API de Fechas Hábiles - Colombia',
                endpoints: {
                    'GET /work-date': 'Calcular fechas hábiles (parámetros: days, hours, date)',
                    'GET /health': 'Verificar estado de la API'
                },
                usage: {
                    examples: [
                        '/work-date?days=1&hours=4',
                        '/work-date?hours=8',
                        '/work-date?date=2025-04-10T15:00:00.000Z&days=5&hours=4'
                    ]
                }
            });
        });
    }

    private initializeErrorHandling(): void {
        this.app.use('*', notFoundHandler);
        this.app.use(globalErrorHandler);
    }
}

export default new App().app;
