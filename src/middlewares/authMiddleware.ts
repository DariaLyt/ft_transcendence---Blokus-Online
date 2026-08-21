import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/env';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  	const token = req.cookies?.auth_token;

	if (!token) {
		return res.status(401).json({ error: 'Access denied. No token provided.' });
	}

	try {
		const decoded = jwt.verify(token, getJwtSecret()) as { userId: number };
		req.user = { userId: decoded.userId };
		next();
	} catch (err) {
		return res.status(403).json({ error: 'Invalid or expired token.' });
	}
}
