import { Request, Response } from 'express';
import { findUserById, getUserPasswordHash, updateUserPassword } from '../db/userQueries';
import bcrypt from 'bcrypt';
import { changePasswordSchema } from '../schemas/userSchemas';
import { ZodError } from 'zod';

export async function getProfile(req: Request, res: Response) {
	try {
		if (!req.user) {
			return res.status(401).json({ error: 'Unauthorized'});
		}

		const user = await findUserById(req.user.userId);
		if (!user) {
			return res.status(404).json({ error: 'User not found' });
		}

		return res.status(200).json({ user });
	} catch (err) {
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}

export async function changePassword(req: Request, res: Response) {
	try {
		if (!req.user) {
			return res.status(401).json({ error: 'Unauthorized' });
		}

		const validated = changePasswordSchema.parse(req.body);

		const currentHash = await getUserPasswordHash(req.user.userId);
		if (!currentHash) {
			return res.status(404).json({ error: 'User not found' });
		}

		const isValidPassword = await bcrypt.compare(validated.currentPassword, currentHash);
		if (!isValidPassword) {
			return res.status(400).json({ error: 'Incorrect current password' });
		}

		const newHash = await bcrypt.hash(validated.newPassword, 10);
		const updated = await updateUserPassword(newHash, req.user.userId);
		if (!updated) {
			return res.status(404).json({ error: 'User not found' });
		}
		return res.status(200).json({ message: 'Password updated successfully' });
	} catch (err: unknown) {
		if (err instanceof ZodError) {
			return res.status(400).json({ error: err.issues });
		}
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}
