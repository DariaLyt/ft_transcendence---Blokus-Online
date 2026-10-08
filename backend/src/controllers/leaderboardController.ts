import type {Request, Response} from 'express';
import {getLeaderboard} from '../db/queries/statistics.js';

function formatAverage(value: unknown): string {
	const n = Number(value);
	return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

export async function leaderboard(req: Request, res: Response) {
    const page = Number(req.query.page ?? 1);

    if (!Number.isSafeInteger(page) || page < 1) {
        return res.status(400).json({ error: 'Invalid page' });
    }
    const rows = await getLeaderboard(11, (page - 1) * 10);
    return res.json({
        hasNext: rows.length > 10,
        entries: rows.slice(0, 10).map(row => ({
            userId: row.userId,
            username: row.username,
            gamesPlayed: row.gamesPlayed,
            totalScore: row.totalScore,
            averageScore: formatAverage(row.averageScore),
        })),
    });
}