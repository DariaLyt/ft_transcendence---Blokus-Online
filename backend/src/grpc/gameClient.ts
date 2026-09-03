import path from 'node:path';
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.resolve(__dirname, '../proto/game.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
	keepCase: true,
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
			user_id: moveData.userId,
			color: moveData.color,
			piece_id: moveData.pieceId,
			origin_x: moveData.originX,
			origin_y: moveData.originY,
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

// export function sendLobbyCreation(createLobby: {
	
// })