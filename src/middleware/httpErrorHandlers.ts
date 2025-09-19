import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        error: 'NotFound',
        message: `Ruta ${req.originalUrl} no encontrada`
    });
};

export const globalErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error('Error no manejado:', error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        error: 'InternalError',
        message: 'Error interno del servidor'
    });
};
