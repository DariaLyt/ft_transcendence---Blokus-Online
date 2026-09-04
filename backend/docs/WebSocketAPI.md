# WebSocket API

## Lobby Actions

### CREATE_LOBBY

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "CREATE_LOBBY",
	"userId": 1,
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
	"userId": 1,
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
	"userId": 1,
    "lobbyId": "lobby-uuid"
  }
}
```

### LEAVE_LOBBY

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "LEAVE_LOBBY",
	"userId": 1,
  }
}
```

### BEGIN_READY_CHECK

```json
{
  "category": "LOBBY",
  "payload": {
    "type": "BEGIN_READY_CHECK",
	"userId": 1,
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
	"userId": 1,
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
	"userId": 1,
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
	"userId": 1,
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
	"userId": 1,
    "color": "red"
  }
}
```

### DISCONNECT

```json
{
  "category": "GAME",
  "action": "DISCONNECT",
  "payload": {
	"userId": 1
  }
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

## Notes

* For backend/GameEngine request/response structures, refer to `game.proto`.
