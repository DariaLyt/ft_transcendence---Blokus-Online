# WebSocket API

## Lobby Actions

### CREATE_LOBBY

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "CREATE_LOBBY",
    "userName": "Alice",
    "maxPlayers": 4
  }
}
```

### JOIN_LOBBY

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "JOIN_LOBBY",
    "userName": "Alice",
    "lobbyId": "lobby-uuid"
  }
}
```

### TOGGLE_READY

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "TOGGLE_READY",
    "lobbyId": "lobby-uuid"
  }
}
```

### LEAVE_LOBBY

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "LEAVE_LOBBY"
  }
}
```

### BEGIN_READY_CHECK

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "BEGIN_READY_CHECK",
    "lobbyId": "lobby-uuid"
  }
}
```

### ACCEPT_READY_CHECK

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "ACCEPT_READY_CHECK",
    "lobbyId": "lobby-uuid"
  }
}
```

### DECLINE_READY_CHECK

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "DECLINE_READY_CHECK",
    "lobbyId": "lobby-uuid"
  }
}
```

---

## Game Actions

### MAKE_MOVE

```json
{
  "category": "GAME",
  "action": "MAKE_MOVE",
  "payload": {
    "color": "red",
    "pieceId": "piece_01",
    "originX": 3,
    "originY": 4,
    "rotation": 90,
    "flip": false
  }
}
```

### PASS_TURN

```json
{
  "category": "GAME",
  "action": "PASS_TURN",
  "payload": {
    "color": "red"
  }
}
```

### DISCONNECT

```json
{
  "category": "GAME",
  "action": "DISCONNECT",
  "payload": {}
}
```

---

## Resync

To request the current state:

```json
{
  "category": "RESYNC"
}
```

---

## Spectator Actions

### WATCH_GAME

Subscribes the current websocket user to live updates for an active game.

```json
{
  "category": "SPECTATE",
  "action": "WATCH_GAME",
  "payload": {
    "gameId": "lobby-or-game-id"
  }
}
```

Successful responses and later live updates use:

```json
{
  "event": "SPECTATOR_GAME_STATE",
  "payload": {
    "success": true,
    "state": "{\"game\":{...}}"
  }
}
```

### LEAVE_GAME

```json
{
  "category": "SPECTATE",
  "action": "LEAVE_GAME",
  "payload": {
    "gameId": "lobby-or-game-id"
  }
}
```

---

## Notes

* For backend/GameEngine request/response structures, refer to `game.proto`.
* WebSocket connections are rate-limited to 10 incoming messages per second.
* The rate limit uses a 1-second window for each WebSocket connection.
* If a client exceeds the limit, the message is rejected and the server sends:

```json
{
  "event": "ERROR",
  "payload": {
    "message": "Rate limit exceeded. Slow down."
  }
}
```

---

## Friend Status

### FRIEND_STATUS_CHANGE

The server sends this event to a user's connected friends when their online status changes.

The event is sent when a user connects to or disconnects from the WebSocket.

**Online:**

```json
{
  "category": "FRIEND_STATUS_CHANGE",
  "payload": {
    "userId": 4,
    "isOnline": true
  }
}
```

**Offline:**

```json
{
  "category": "FRIEND_STATUS_CHANGE",
  "payload": {
    "userId": 4,
    "isOnline": false
  }
}
```

### Payload

| Field      | Type    | Description                                                       |
| ---------- | ------- | ----------------------------------------------------------------- |
| `userId`   | number  | ID of the friend whose status changed                             |
| `isOnline` | boolean | `true` when the friend comes online, `false` when they go offline |

**Notes:**

* The event is only sent to users who are friends with the user whose status changed.
* Only accepted friendships are notified.
* The event is sent automatically by the server; clients do not need to request it.
* `isOnline: true` is sent when the user connects via WebSocket.
* `isOnline: false` is sent when the user's final WebSocket connection closes.

