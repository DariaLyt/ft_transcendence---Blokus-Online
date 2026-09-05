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

## Errors

Generic error payload

```json
{
  "category": "ERROR",
  "payload": {
    "code": "INVALID_PAYLOAD",
    "message": "Invalid message payload structure",
    "details": {},
    "state": {}
  }
}
```

---

## Notes

* For backend/GameEngine request/response structures, refer to `game.proto`.
