import { randomUUID } from 'node:crypto';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Assigns a correlation ID to every request, reusing an inbound header value
 * (e.g. set by an upstream proxy/gateway) when present so traces stay
 * consistent across services.
 */
export function requestId(req, res, next) {
  const incomingId = req.headers[REQUEST_ID_HEADER];
  req.id = (typeof incomingId === 'string' && incomingId) || randomUUID();
  res.setHeader(REQUEST_ID_HEADER, req.id);
  next();
}
