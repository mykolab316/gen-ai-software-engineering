import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { Response } from 'express';

@Catch()
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle class-validator ValidationError arrays (thrown by ValidationPipe with custom exceptionFactory)
    if (Array.isArray(exception) && exception[0] instanceof ValidationError) {
      const details = this.flattenErrors(exception as ValidationError[]);
      response.status(400).json({
        error: 'Validation failed',
        details,
      });
      return;
    }

    // Handle standard NestJS HttpExceptions (NotFoundException, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      response.status(status).json(
        typeof exceptionResponse === 'string'
          ? { error: exceptionResponse }
          : exceptionResponse,
      );
      return;
    }

    // Fallback for unexpected errors
    response.status(500).json({
      error: 'Internal server error',
    });
  }

  private flattenErrors(
    errors: ValidationError[],
    parentField?: string,
  ): { field: string; message: string }[] {
    const result: { field: string; message: string }[] = [];

    for (const error of errors) {
      const field = parentField
        ? `${parentField}.${error.property}`
        : error.property;

      if (error.constraints) {
        const messages = Object.values(error.constraints);
        for (const message of messages) {
          result.push({ field, message });
        }
      }

      if (error.children && error.children.length > 0) {
        result.push(...this.flattenErrors(error.children, field));
      }
    }

    return result;
  }
}
