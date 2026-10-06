import { authHandlers } from './auth-handlers';
import { cvHandlers } from './cv-handlers';

export const handlers = [...authHandlers, ...cvHandlers];
