import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from './conn.js';

export async function runMigrations() {
	try {
		console.log('Running database migrations...');
		await migrate(db, { migrationsFolder: './drizzle' });
		console.log('Database migrations applied successfully!');
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}