import { Response } from 'express';
import { ApiErrorResponse, ApiErrors } from '../types';

/**
 * Clase para manejar errores específicos de la API de forma centralizada
 */
export class ApiErrorHandler {

    /**
     * Manejar errores de la API y enviar respuesta apropiada
     * @param error - Error capturado
     * @param res - Response de Express
     */
    public static handleError(error: any, res: Response): void {
        console.error('Error en API:', error);

        let statusCode = 500;
        let errorType = ApiErrors.INTERNAL_ERROR;
        let message = 'Error interno del servidor';

        if (error instanceof Error) {
            // Parsear el tipo de error del mensaje
            if (error.message.includes(ApiErrors.INVALID_PARAMETERS)) {
                statusCode = 400;
                errorType = ApiErrors.INVALID_PARAMETERS;
                message = error.message.replace(`${ApiErrors.INVALID_PARAMETERS}: `, '');
            } else if (error.message.includes(ApiErrors.INVALID_DATE_FORMAT)) {
                statusCode = 400;
                errorType = ApiErrors.INVALID_DATE_FORMAT;
                message = error.message.replace(`${ApiErrors.INVALID_DATE_FORMAT}: `, '');
            } else if (error.message.includes(ApiErrors.NEGATIVE_VALUES)) {
                statusCode = 400;
                errorType = ApiErrors.NEGATIVE_VALUES;
                message = error.message.replace(`${ApiErrors.NEGATIVE_VALUES}: `, '');
            } else {
                message = error.message;
            }
        }

        const errorResponse: ApiErrorResponse = {
            error: errorType,
            message
        };

        res.status(statusCode).json(errorResponse);
    }

    /**
     * Crear un error personalizado con tipo específico de la API
     * @param type - Tipo de error de la API
     * @param message - Mensaje del error
     * @returns Error con el formato apropiado
     */
    public static createError(type: ApiErrors, message: string): Error {
        return new Error(`${type}: ${message}`);
    }
}
