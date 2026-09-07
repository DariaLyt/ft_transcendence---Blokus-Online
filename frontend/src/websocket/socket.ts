
export const socket = new WebSocket("wss://localhost:3000"); // open WebSocket so we have ongoing connection

export function sendMessage(message: object) {
	socket.send(JSON.stringify(message)); // turns JS object into JSON text and sends it through open WebSocket
}

type SocketMessage = {
	event: string;
	payload: unknown; // we know the outer structure, but payload changes depending on the event
};

export function onMessage(handler: (message: SocketMessage) => void) {
	const handleMessage = (event: MessageEvent) => { // runs when backend sends something
		const message: SocketMessage = JSON.parse(event.data); // turns into JS object
		handler(message); // passes object to whoever asked to receive messages
	};

	socket.addEventListener("message", handleMessage); // many functions can listen to the same WebSocket
	return () => {
		socket.removeEventListener("message", handleMessage); // stop listening individually whenever the components on screen keep changing
	};
}