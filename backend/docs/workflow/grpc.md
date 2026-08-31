### 1. .proto

```proto
service GameService {
    rpc HandleLobbyAction(LobbyActionRequest) returns (ActionResponse);
    rpc HandleGameAction(GameActionRequest) returns (ActionResponse);
    rpc GetGameStateSnapshot(GameStateRequest) returns (GameStateResponse);
}

message LobbyActionRequest {
    int32 user_id = 1;
    string action = 2;
    string payload = 3;
}

message GameActionRequest {
    int32 user_id = 1;
    string action = 2;
    string payload = 3;
}

message GameStateRequest {
    int32 user_id = 1;
}

message ActionResponse {
    bool success = 1;
}

message GameStateResponse {
    string state = 1;
}
```

---

### 2. Node creates a gRPC client

```ts
const gameClient = new GameServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
);
```

Node calls Go:

```text
Node
 │
 │ gameClient.HandleLobbyAction(...)
 ▼
Go
```

---

### 3. gameModules

```ts
const gameModules: GameModules = {

    handleLobbyAction: (userId, action, payload) => {
        gameClient.handleLobbyAction({
            userId,
            action,
            payload: JSON.stringify(payload),
        });
    },

    handleGameAction: (userId, action, payload) => {
        gameClient.handleGameAction({
            userId,
            action,
            payload: JSON.stringify(payload),
        });
    },

    getGameStateSnapshot: (userId) => {
        return gameClient.getGameStateSnapshot({
            userId,
        });
    },

};
```

### example

```proto
service GameService {
    rpc CreateLobby(CreateLobbyRequest) returns (ActionResponse);
}

message CreateLobbyRequest {
    int32 user_id = 1;
    int32 max_players = 2;
}
```

Node code sends:

```ts
gameClient.createLobby({
    userId,
    maxPlayers: payload.maxPlayers,
});
```