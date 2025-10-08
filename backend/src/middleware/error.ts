import type { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err?.code === 'P2002') {
    return res.status(409).json({ error: 'Unique constraint violation' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal error' });
}
