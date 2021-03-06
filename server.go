//  server.go
//  Benedict Henshaw, 2019

package main

import (
    "flag"
    "fmt"
    "log"
    "github.com/gorilla/websocket"
    "net/http"
)

// Number of connected users who have opted to play.
var player_count int = 0

// Maximum number of players allowed. User connected after the max has been
// reached will only be allowed to spectate the game.
var player_max int = 5

var player_slots [5]bool

func find_and_take_free_player_slot() int {
    for i := 0; i < len(player_slots); i++ {
        if player_slots[i] == false {
            player_slots[i] = true
            return i
        }
    }
    return -1
}

// Array of all users that have announced themselves to the server.
var users []*websocket.Conn

//
// WebSocket.
//

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
}

func websocket_handler(writer http.ResponseWriter, request *http.Request) {
    // Upgrade all connections to this address ("/ws") to WebSocket connections.
    c, e := upgrader.Upgrade(writer, request, nil)
    if e != nil {
        fmt.Printf("WebSocket Error (Upgrade): %s\n", e)
        return
    }

    fmt.Printf("New connection: %s\n", c.RemoteAddr());

    // Wait for (and respond to) a message from the user declaring whether they
    // want to play or spectate.
    _, message, e := c.ReadMessage()
    if e != nil {
        fmt.Printf("Error while waiting for join message: %s\n", e)
        return
    }

    slot := -1

    if string(message) == "ready" {
        slot = find_and_take_free_player_slot();
        if slot != -1 {
            join_message := fmt.Sprintf(`{"type":"join","player_index":%d}`, slot)
            c.WriteMessage(websocket.TextMessage, []byte(join_message))
        } else {
            join_message := fmt.Sprintf(`{"type":"spec"}`)
            c.WriteMessage(websocket.TextMessage, []byte(join_message))
        }
    } else {
        join_message := fmt.Sprintf(`{"type":"spec"}`)
        c.WriteMessage(websocket.TextMessage, []byte(join_message))
    }

    // Now that this connection has announced itself, put it into the array.
    // Reuse any empty slots before allocating a new one.
    users = append(users, c)
    id := len(users) - 1

    fmt.Printf("Player joined [%d]: %d\n", id, slot);

    // Handle all incoming messages, echoing them to every connected user.
    for {
        message_type, message, e := c.ReadMessage()
        if e != nil {
            fmt.Printf("ER: %s\n", e)
            // Kick out any users that we cannot accept messages from.
            c.Close()
            users[id] = nil
            if slot != -1 {
                player_slots[slot] = false
            }
            return
        }

        fmt.Printf("[%d] %s\n", id, string(message))

        for i, u := range users {
            if u != nil {
                e := u.WriteMessage(message_type, message)
                if e != nil {
                    fmt.Printf("EW: %s\n", e)
                }
                fmt.Printf("Sent to [%d]: %s\n", i, string(message))
            }
        }
    }
}

//
// Main.
//

func main() {
    //
    // Command-line arguments.
    //

    cert := flag.String("cert", "",     "TLS certificate.")
    key  := flag.String("key",  "",     "TLS private key.")
    dir  := flag.String("path", "web/", "Static file directory.")
    flag.Parse()

    //
    // Web server.
    //

    http.HandleFunc("/ws", websocket_handler)

    // If we have the credentials for TLS, use HTTPS. Otherwise, use HTTP.
    if *cert != "" && *key != "" {
        go func() {
            // Redirect HTTP requests to HTTPS.
            redirector := http.HandlerFunc(func(writer http.ResponseWriter, request * http.Request) {
                http.Redirect(writer, request,
                    "https://"+request.Host+request.RequestURI,
                    http.StatusMovedPermanently)
            })
            log.Fatal(http.ListenAndServe(":80", redirector))
            fmt.Printf("Launched HTTP -> HTTPS Redirector on port 80.\n");
        }()

        file_server := http.FileServer(http.Dir(*dir))
        http.Handle("/", file_server)
        log.Fatal(http.ListenAndServeTLS(":443", *cert, *key, nil))
        fmt.Printf("Launched HTTPS Server on port 80.\n");
    } else {
        file_server := http.FileServer(http.Dir(*dir))
        http.Handle("/", file_server)
        log.Fatal(http.ListenAndServe(":80", nil))
        fmt.Printf("Launched HTTP Server on port 80.\n");
    }
}
