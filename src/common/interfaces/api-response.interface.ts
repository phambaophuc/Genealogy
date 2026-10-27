export interface ApiErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  requestId: string | null;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
  requestId: string | null;
  path: string;
  method: string;
  timestamp: string;
}
