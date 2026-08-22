import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
	err: any,
  	req: Request,
  	res: Response,
  	next: NextFunction
) {
  	if (err instanceof ZodError) {
		return res.status(400).json({
			error: 'Validation Error',
			details: err.issues,
		});
	}

	if (err instanceof SyntaxError && 'body' in err) {
		return res.status(400).json({ error: 'Invalid JSON payload' });
	}

	console.error('Unhandled Error:', err);
	return res.status(500).json({
		error: 'Internal Server Error',
		message: process.env.NODE_ENV === 'development' ? err.message : undefined,
	});
}