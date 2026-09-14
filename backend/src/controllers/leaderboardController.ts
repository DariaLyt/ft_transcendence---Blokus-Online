import type {Request, Response} from 'express';
import {getLeaderboard} from '../db/queries/statistics.js';

export async function leaderboard(req: Request, res: Response){
    const result = await getLeaderboard();

    return res.status(200).json(result);
}