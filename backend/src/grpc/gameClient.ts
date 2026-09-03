import path from 'node:path';
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../proto/game.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
	oneofs: true,
    defaults: true,
});

const gameProto = (grpc.loadPackageDefinition(packageDefinition) as any).game;

const GO_ENGINE_URL = process.env.GO_ENGINE_URL || 'localhost:50051';

export const gameClient = new gameProto.GameEngine(
	GO_ENGINE_URL,
	grpc.credentials.createInsecure()
);

export function sendMoveToGoEngine(moveData: {
	userId: number;
	color: string;
	pieceId: string;
	originX: number;
	originY: number;
	rotation: number;
	flip: boolean;
}): Promise<any> {
	return new Promise((resolve, reject) => {
		const payload = {
			userId: moveData.userId,
			color: moveData.color,
			pieceId: moveData.pieceId,
			originX: moveData.originX,
			originY: moveData.originY,
			rotation: moveData.rotation,
			flip: moveData.flip,
		};

		gameClient.ValidateAndMakeMove(payload, (err: any, response: any) => {
			if (err) {
				return reject(err);
			}
			resolve(response);
		});
	});
}

export function sendLobbyAction(
    userId: number,
    payload: Record<string, any>
): Promise<any> {
    return new Promise((resolve, reject) => {
        const request = {
            userId,
            ...payload,
        };

        gameClient.HandleLobbyAction(request, (err: any, response: any) => {
            if (err) return reject(err);
            resolve(response);
        });
    });
}
