import serverlessExpress from '@vendia/serverless-express';
import app from './app';
import { holidayManager } from './utils/holidayUtils';

holidayManager.loadHolidays();

export const handler = serverlessExpress({ app });
