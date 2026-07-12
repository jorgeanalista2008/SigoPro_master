import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from './i18n.service';

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    
    const exceptionResponse: any = exception.getResponse();
    let message = '';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse.message === 'string') {
      message = exceptionResponse.message;
    } else if (exceptionResponse && Array.isArray(exceptionResponse.message)) {
      message = exceptionResponse.message.join(', ');
    }

    // Translate common message cases
    let translatedMessage = message;
    
    if (message === 'Forbidden resource' || message.includes('No posees los permisos') || message.includes('No tienes permisos')) {
      translatedMessage = this.i18n.t('FORBIDDEN_RESOURCE');
    } else if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('no encontrado')) {
      translatedMessage = this.i18n.t('RESOURCE_NOT_FOUND');
    } else if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('ya existe') || message.toLowerCase().includes('duplicate')) {
      translatedMessage = this.i18n.t('DUPLICATE_RESOURCE');
    } else if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('inválido')) {
      translatedMessage = this.i18n.t('INVALID_INPUT');
    } else {
      // Try resolving directly as a translation key
      translatedMessage = this.i18n.t(message);
    }

    response.status(status).json({
      statusCode: status,
      message: translatedMessage,
      error: exceptionResponse.error || exception.name,
      timestamp: new Date().toISOString(),
    });
  }
}
