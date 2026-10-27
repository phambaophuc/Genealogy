import { RequestWithContext } from '../interfaces/request-with-context.interface';

/**
 * pino-http allows request ids to be strings, numbers or objects. Our genReqId
 * always produces a string, but keep the conversion defensive for safety.
 */
export function getRequestId(request: RequestWithContext): string | null {
  const id: unknown = request.id;

  if (typeof id === 'string') {
    return id;
  }

  if (typeof id === 'number') {
    return String(id);
  }

  return null;
}
