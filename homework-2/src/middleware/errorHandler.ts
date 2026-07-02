import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  console.error(`[ERROR] ${err.message}`);
  
  if (err.name === 'MulterError') {
    res.status(400).json({ error: `File upload error: ${err.message}` });
    return;
  }

  res.status(500).json({ error: 'Internal server error' });
}
