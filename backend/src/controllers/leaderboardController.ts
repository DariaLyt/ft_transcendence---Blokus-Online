import type {Request, Response} from 'express';
import {getLeaderboard} from '../db/queries/statistics.js';

function formatAverage(value: unknown): string {
	const n = Number(value);
	return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

export async function leaderboard(req: Request, res: Response){
    const result = await getLeaderboard();

    return res.status(200).json(
		result.map((row) => ({
			...row,
			averageScore: formatAverage(row.averageScore),
		}))
	);
}