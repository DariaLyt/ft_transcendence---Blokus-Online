export const socket = new WebSocket("wss://localhost:3000"); // open WebSocket so we have ongoing connection

export function sendMessage(message: object) {
	socket.send(JSON.stringify(message)); // turns JS object into JSON text and sends it through open WebSocket
}