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
	pb.RegisterGameEngineServer(s, game.NewGameEngine())
	log.Println("GameEngine gRPC on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
