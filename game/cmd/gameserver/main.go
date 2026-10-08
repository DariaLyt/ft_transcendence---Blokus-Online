package main

import (
	"log"
	"net"

	"blokus/game"
	pb "blokus/game/proto/pb"

	"google.golang.org/grpc"
)

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("listen: %v", err)
	}
	s := grpc.NewServer()
	eng := game.NewGameEngine()
	eng.BotDelay = game.DefaultBotDelay
	pb.RegisterGameEngineServer(s, eng)
	log.Println("GameEngine gRPC on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
