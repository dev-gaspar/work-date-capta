import { Request, Response } from 'express';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import {
    ApiQueryParams,
    ProcessedParams,
    ApiSuccessResponse,
    ApiErrors
} from '../types';
import { dateService, WORKING_CONFIG } from '../services/dateService';
import { ApiErrorHandler } from '../utils/apiErrorHandler';

dayjs.extend(utc);
dayjs.extend(timezone);

export class DateController {

    public async calculateWorkingDate(req: Request, res: Response): Promise<void> {
        try {
            const queryParams: ApiQueryParams = {
                days: req.query.days as string,
                hours: req.query.hours as string,
                date: req.query.date as string
            };

            const processedParams = this.validateAndProcessParams(queryParams);
            const resultDate = dateService.calculateWorkingDate(processedParams);

            const response: ApiSuccessResponse = {
                date: resultDate
            };

            res.status(200).json(response);

        } catch (error) {
            ApiErrorHandler.handleError(error, res);
        }
    }

    private validateAndProcessParams(params: ApiQueryParams): ProcessedParams {
        const { days, hours, date } = params;

        if (!days && !hours) {
            throw ApiErrorHandler.createError(ApiErrors.INVALID_PARAMETERS, 'Debe proporcionar al menos \'days\' o \'hours\'');
        }

        let processedDays = 0;
        if (days !== undefined) {
            processedDays = parseInt(days, 10);
            if (isNaN(processedDays) || processedDays < 0) {
                throw ApiErrorHandler.createError(ApiErrors.INVALID_PARAMETERS, '\'days\' debe ser un número entero positivo');
            }
        }

        let processedHours = 0;
        if (hours !== undefined) {
            processedHours = parseInt(hours, 10);
            if (isNaN(processedHours) || processedHours < 0) {
                throw ApiErrorHandler.createError(ApiErrors.INVALID_PARAMETERS, '\'hours\' debe ser un número entero positivo');
            }
        }

        let startDate: Date;
        if (date) {
            if (!this.isValidISODateWithZ(date)) {
                throw ApiErrorHandler.createError(ApiErrors.INVALID_DATE_FORMAT, '\'date\' debe estar en formato ISO 8601 UTC con sufijo Z');
            }

            const parsedDate = dayjs(date);
            if (!parsedDate.isValid()) {
                throw ApiErrorHandler.createError(ApiErrors.INVALID_DATE_FORMAT, 'Fecha inválida proporcionada');
            }

            startDate = parsedDate.toDate();
        } else {
            startDate = dayjs().tz(WORKING_CONFIG.timezone).toDate();
        }

        return {
            days: processedDays,
            hours: processedHours,
            startDate
        };
    }

    private isValidISODateWithZ(dateString: string): boolean {
        const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
        return iso8601Regex.test(dateString);
    }

}

export const dateController = new DateController();
