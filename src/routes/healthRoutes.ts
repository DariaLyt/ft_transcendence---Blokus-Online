import { Router } from 'express';
import { pool } from '../db/index';

const router = Router();

router.get('/', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        
        return res.status(200).json({
            status: 'ok',
            database: 'connected'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'error',
            database: 'disconnected',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;