import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ValidationError,
  EntityValidationError,
  ForbiddenError,
  InvalidArgumentError,
} from '@/shared/domain/errors';

/**
 * Global exception filter that maps domain errors to HTTP responses.
 *
 * Registration (global scope):
 *   app.useGlobalFilters(new DomainErrorFilter());
 *
 * Response shape:
 *   { statusCode: number, message: string | object, timestamp: string, path: string }
 */
@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  private readonly errorStatusMap = new Map<
    new (...args: unknown[]) => Error,
    number
  >([
    [NotFoundError,           HttpStatus.NOT_FOUND],
    [ConflictError,           HttpStatus.CONFLICT],
    [BadRequestError,         HttpStatus.BAD_REQUEST],
    [ValidationError,         HttpStatus.BAD_REQUEST],
    [EntityValidationError,   HttpStatus.BAD_REQUEST],
    [ForbiddenError,          HttpStatus.FORBIDDEN],
    [InvalidArgumentError,    HttpStatus.UNPROCESSABLE_ENTITY],
  ]);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof Error) {
      const ExceptionClass = exception.constructor as new (...args: unknown[]) => Error;

      if (this.errorStatusMap.has(ExceptionClass)) {
        status = this.errorStatusMap.get(ExceptionClass);

        if (exception instanceof EntityValidationError) {
          message = { errors: exception.errors };
        } else {
          message = exception.message;
        }
      } else if (exception instanceof HttpException) {
        status = exception.getStatus();
        const body = exception.getResponse();
        message =
          typeof body === 'object' && body && 'message' in body
            ? (body as { message: string | object }).message
            : exception.message;
      } else {
        message = `Internal server error: ${exception.message}`;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
