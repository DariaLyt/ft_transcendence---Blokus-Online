import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../conn.js';
import { users, games } from '../schema.js';
import { recordFinishedGame } from '../../services/gameResults.js';


const DEMO_USERS = [
    { username: 'demo_blue', email: 'demo_blue@example.com' },
    { username: 'demo_yellow', email: 'demo_yellow@example.com' },
    { username: 'demo_red', email: 'demo_red@example.com' },
    { username: 'demo_green', email: 'demo_green@example.com' },
];

const DEMO_GAMES = [
    {
        id: 'DEMO_GAME_001',
        finishedAt: '2026-10-01T12:00:00Z',
        blue: 15,
        yellow: -14,
        red: -11,
        green: -13,
    },
    {
        id: 'DEMO_GAME_002',
        finishedAt: '2026-10-02T12:00:00Z',
        blue: -8,
        yellow: -8,
        red: -13,
        green: -11,
    },
];

export async function seedDemoData() {
    const password = process.env.DEMO_PASSWORD;

    if (!password) {
        throw new Error('DEMO_PASSWORD is required for demo data');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const demoUserIds = await db.transaction(async tx => {
        const ids = new Map<string, number>();

        for (const demoUser of DEMO_USERS) {
            await tx
                .insert(users)
                .values({
                    username: demoUser.username,
                    email: demoUser.email,
                    passwordHash,
                })
                .onConflictDoNothing({
                    target: users.username,
                });

            const [savedUser] = await tx
                .select({
                    id: users.id,
                    email: users.email,
                })
                .from(users)
                .where(eq(users.username, demoUser.username));

            if (!savedUser || savedUser.email !== demoUser.email) {
                throw new Error(
                    `Demo username is already in use: ${demoUser.username}`,
                );
            }

            ids.set(demoUser.username, savedUser.id);
        }

        return ids;
    });

    const blueId = demoUserIds.get('demo_blue');
    const yellowId = demoUserIds.get('demo_yellow');
    const redId = demoUserIds.get('demo_red');
    const greenId = demoUserIds.get('demo_green');

    if (blueId === undefined || yellowId === undefined || redId === undefined || greenId === undefined) {
        throw new Error('Could not retrieve demo user IDs');
    }

    for (const demoGame of DEMO_GAMES) {
        await recordFinishedGame({
            game: {
                id: demoGame.id,
                status: 'finished',
                seats: [
                    {
                        userId: blueId,
                        kind: 'human',
                        color: 'blue',
                    },
                    {
                        userId: yellowId,
                        kind: 'human',
                        color: 'yellow',
                    },
                    {
                        userId: redId,
                        kind: 'human',
                        color: 'red',
                    },
                    {
                        userId: greenId,
                        kind: 'human',
                        color: 'green',
                    },
                ],
                scores: {
                    blue: demoGame.blue,
                    yellow: demoGame.yellow,
                    red: demoGame.red,
                    green: demoGame.green,
                },
            },
        });

        await db
            .update(games)
            .set({
                finishedAt: new Date(demoGame.finishedAt),
            })
            .where(eq(games.id, demoGame.id));
    }
}