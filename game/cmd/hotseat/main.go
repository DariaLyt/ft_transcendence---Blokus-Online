package main

import (
	"bufio"
	"flag"
	"fmt"
	"math/rand"
	"os"
	"strconv"
	"strings"
	"time"

	"blokus/game"
)

func main() {
	modeFlag := flag.String("mode", "", "game mode: M4P, M1P3B, M2P2B, M3P1B")
	seedFlag := flag.Int64("seed", 0, "RNG seed for bots (0 = time-based)")
	flag.Parse()

	fmt.Println("Blokus hotseat CLI")
	fmt.Println("Turn order: blue → yellow → red → green")
	fmt.Println()

	in := bufio.NewScanner(os.Stdin)
	mode, err := chooseMode(*modeFlag, in)
	if err != nil {
		fmt.Fprintf(os.Stderr, "mode: %v\n", err)
		os.Exit(1)
	}

	seats, err := game.DefaultSeatsForMode(mode)
	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}

	seed := *seedFlag
	if seed == 0 {
		seed = time.Now().UnixNano()
	}
	bot := &game.Bot{RNG: rand.New(rand.NewSource(seed))}

	state := game.NewActiveGame("hotseat-1", mode, seats)
	fmt.Printf("Mode %s — %s (bot seed %d)\n", mode, game.ModeDescription(mode), seed)
	printSeats(seats)
	fmt.Println()

	printHelp()
	game.ResolvePasses(state)
	runBots(state, bot)
	printFrame(state)

	for state.Status == game.StatusActive {
		if game.IsBotTurn(state) {
			runBots(state, bot)
			if state.Status != game.StatusActive {
				break
			}
			printFrame(state)
			continue
		}

		fmt.Printf("\n%s (human)> ", state.CurrentColor)
		if !in.Scan() {
			break
		}
		line := strings.TrimSpace(in.Text())
		if line == "" {
			continue
		}
		if err := handle(state, bot, line); err != nil {
			fmt.Printf("! %v\n", err)
			continue
		}
		if state.Status == game.StatusActive {
			runBots(state, bot)
			printFrame(state)
		}
	}

	if state.Status == game.StatusFinished {
		fmt.Println()
		fmt.Println(game.RenderBoard(state))
		fmt.Println(game.RenderScores(state))
		fmt.Println("Game over.")
	}
}

func chooseMode(flagValue string, in *bufio.Scanner) (game.GameMode, error) {
	if flagValue != "" {
		return game.ParseMode(flagValue)
	}

	fmt.Println("Choose a game mode:")
	for i, m := range game.AllModes {
		fmt.Printf("  %d) %-6s  %s\n", i+1, m, game.ModeDescription(m))
	}
	fmt.Print("mode [1-4 or name, default M1P3B]: ")
	if !in.Scan() {
		return game.ModeM1P3B, nil
	}
	raw := strings.TrimSpace(in.Text())
	if raw == "" {
		return game.ModeM1P3B, nil
	}
	if n, err := strconv.Atoi(raw); err == nil {
		if n < 1 || n > len(game.AllModes) {
			return "", fmt.Errorf("pick 1..%d", len(game.AllModes))
		}
		return game.AllModes[n-1], nil
	}
	return game.ParseMode(raw)
}

func printSeats(seats []game.Seat) {
	for _, s := range seats {
		fmt.Printf("  %s: %s\n", s.Color, s.Kind)
	}
}

func runBots(state *game.GameState, bot *game.Bot) {
	for state.Status == game.StatusActive && game.IsBotTurn(state) {
		m, err := bot.PlayTurn(state)
		if err != nil {
			game.ResolvePasses(state)
			if state.Status != game.StatusActive {
				return
			}
			if game.IsBotTurn(state) && !game.HasLegalMove(state, state.CurrentColor) {
				state.Passed[state.CurrentColor] = true
				// advance via ResolvePasses
				game.ResolvePasses(state)
			}
			continue
		}
		fmt.Printf("bot %s played %s at (%d,%d) rot=%d flip=%v\n",
			m.Color, m.PieceID, m.X, m.Y, m.Rotation, m.Flipped)
	}
}

func printHelp() {
	fmt.Println(`Commands:
  help                         show this help
  board                        redraw board
  hand                         show current player's pieces
  seats                        show human/bot seats
  show <piece> [rot] [flip]    preview a piece (rot=0|90|180|270, flip=0|1)
  ghost <piece> <x> <y> [rot] [flip]
                               preview placement on the board
  place <piece> <x> <y> [rot] [flip]
                               place a piece (default rot=0 flip=0)
  legal [n]                    list up to n legal moves (default 15)
  auto                         let the heuristic bot play this human turn once
  autofill                     bots+auto play until the game ends
  scores                       show current score estimate
  quit                         exit`)
}

func printFrame(state *game.GameState) {
	fmt.Println()
	fmt.Print(game.RenderStatus(state))
	fmt.Println(game.RenderBoard(state))
	if state.Status == game.StatusActive && !game.IsBotTurn(state) {
		fmt.Print(game.RenderHand(state, state.CurrentColor))
	}
}

func handle(state *game.GameState, bot *game.Bot, line string) error {
	fields := strings.Fields(line)
	cmd := strings.ToLower(fields[0])

	switch cmd {
	case "help", "h", "?":
		printHelp()
		return nil
	case "board", "b":
		return nil
	case "hand":
		fmt.Print(game.RenderHand(state, state.CurrentColor))
		return nil
	case "seats":
		printSeats(state.Seats)
		return nil
	case "scores", "score":
		fmt.Print(game.RenderScores(state))
		return nil
	case "quit", "exit", "q":
		os.Exit(0)
		return nil
	case "show":
		return cmdShow(fields)
	case "ghost":
		return cmdGhost(state, fields)
	case "place", "p":
		return cmdPlace(state, fields)
	case "legal", "moves":
		return cmdLegal(state, fields)
	case "auto":
		m, err := bot.PlayTurn(state)
		if err != nil {
			return err
		}
		fmt.Printf("auto: %s %s at (%d,%d) rot=%d flip=%v\n",
			m.Color, m.PieceID, m.X, m.Y, m.Rotation, m.Flipped)
		return nil
	case "autofill":
		return cmdAutofill(state, bot)
	default:
		return fmt.Errorf("unknown command %q (try help)", fields[0])
	}
}

func cmdShow(fields []string) error {
	piece, rot, flip, err := parsePieceOrient(fields, 1)
	if err != nil {
		return err
	}
	art, err := game.RenderPieceASCII(piece, rot, flip, game.ColorBlue)
	if err != nil {
		return err
	}
	fmt.Print(art)
	return nil
}

func cmdGhost(state *game.GameState, fields []string) error {
	move, err := parseMove(state.CurrentColor, fields, 1)
	if err != nil {
		return err
	}
	if err := game.ValidateMove(state, move); err != nil {
		fmt.Printf("invalid: %v\n", err)
	} else {
		fmt.Println("valid placement")
	}
	view, err := game.RenderBoardWithGhost(state, move)
	if err != nil {
		return err
	}
	fmt.Print(view)
	return nil
}

func cmdPlace(state *game.GameState, fields []string) error {
	if game.IsBotTurn(state) {
		return fmt.Errorf("it is a bot's turn")
	}
	move, err := parseMove(state.CurrentColor, fields, 1)
	if err != nil {
		return err
	}
	if err := game.ValidateMove(state, move); err != nil {
		return err
	}
	view, _ := game.RenderBoardWithGhost(state, move)
	fmt.Println("placing:")
	fmt.Print(view)
	if err := game.ApplyMove(state, move); err != nil {
		return err
	}
	fmt.Printf("OK: placed %s at (%d,%d) rot=%d flip=%v\n",
		move.PieceID, move.X, move.Y, move.Rotation, move.Flipped)
	return nil
}

func cmdLegal(state *game.GameState, fields []string) error {
	limit := 15
	if len(fields) >= 2 {
		n, err := strconv.Atoi(fields[1])
		if err != nil || n <= 0 {
			return fmt.Errorf("usage: legal [n]")
		}
		limit = n
	}
	moves := game.LegalMoves(state, state.CurrentColor, limit)
	fmt.Printf("%d legal move(s) shown (cap %d):\n", len(moves), limit)
	for i, m := range moves {
		fmt.Printf("  %2d) %s x=%d y=%d rot=%d flip=%v\n",
			i+1, m.PieceID, m.X, m.Y, m.Rotation, m.Flipped)
	}
	if len(moves) == 0 {
		fmt.Println("(none — this color will auto-pass)")
	}
	return nil
}

func cmdAutofill(state *game.GameState, bot *game.Bot) error {
	steps := 0
	for state.Status == game.StatusActive {
		game.ResolvePasses(state)
		if state.Status != game.StatusActive {
			break
		}
		m, err := bot.PlayTurn(state)
		if err != nil {
			game.ResolvePasses(state)
			continue
		}
		steps++
		if steps%12 == 0 {
			fmt.Printf("--- after %d moves (last %s %s) ---\n", steps, m.Color, m.PieceID)
			fmt.Print(game.RenderStatus(state))
			fmt.Println(game.RenderBoard(state))
		}
	}
	fmt.Printf("autofill done after %d moves\n", steps)
	return nil
}

func parseMove(color game.Color, fields []string, start int) (game.Move, error) {
	if len(fields) < start+3 {
		return game.Move{}, fmt.Errorf("usage: place <piece> <x> <y> [rot] [flip]")
	}
	piece := game.PieceID(fields[start])
	if game.PieceSize(piece) == 0 {
		return game.Move{}, fmt.Errorf("unknown piece %q", fields[start])
	}
	x, err := strconv.Atoi(fields[start+1])
	if err != nil {
		return game.Move{}, fmt.Errorf("bad x")
	}
	y, err := strconv.Atoi(fields[start+2])
	if err != nil {
		return game.Move{}, fmt.Errorf("bad y")
	}
	rot := game.Rot0
	flip := false
	if len(fields) > start+3 {
		r, err := strconv.Atoi(fields[start+3])
		if err != nil {
			return game.Move{}, fmt.Errorf("bad rot")
		}
		rot = game.Rotation(r)
	}
	if len(fields) > start+4 {
		f, err := strconv.Atoi(fields[start+4])
		if err != nil || (f != 0 && f != 1) {
			return game.Move{}, fmt.Errorf("flip must be 0 or 1")
		}
		flip = f == 1
	}
	return game.Move{
		Color:    color,
		PieceID:  string(piece),
		Rotation: rot,
		Flipped:  flip,
		X:        x,
		Y:        y,
	}, nil
}

func parsePieceOrient(fields []string, start int) (game.PieceID, game.Rotation, bool, error) {
	if len(fields) < start+1 {
		return "", 0, false, fmt.Errorf("usage: show <piece> [rot] [flip]")
	}
	piece := game.PieceID(fields[start])
	if game.PieceSize(piece) == 0 {
		return "", 0, false, fmt.Errorf("unknown piece %q", fields[start])
	}
	rot := game.Rot0
	flip := false
	if len(fields) > start+1 {
		r, err := strconv.Atoi(fields[start+1])
		if err != nil {
			return "", 0, false, fmt.Errorf("bad rot")
		}
		rot = game.Rotation(r)
	}
	if len(fields) > start+2 {
		f, err := strconv.Atoi(fields[start+2])
		if err != nil || (f != 0 && f != 1) {
			return "", 0, false, fmt.Errorf("flip must be 0 or 1")
		}
		flip = f == 1
	}
	return piece, rot, flip, nil
}
