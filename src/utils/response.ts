import type { Response } from 'express';

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

interface PaginatedResponse<T = any> extends SuccessResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  res.status(statusCode).json(response);
};

export const sendPaginated = <T>(
  res: Response,
  data: T,
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  message?: string
): void => {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    pagination: {
      ...pagination,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
    ...(message && { message }),
  };

  res.status(200).json(response);
};

export const sendCreated = <T>(res: Response, data: T, message?: string): void => {
  sendSuccess(res, data, message, 201);
};

export const sendNoContent = (res: Response): void => {
  res.status(204).send();
};
