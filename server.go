package main

import (
    "flag"
    "fmt"
    "github.com/gorilla/websocket"
    "net/http"
)

type user struct {
    connection *websocket.Conn
    active     bool
    id         int
}

var users []user
var user_count int

func count_active_users() int {
    count := 0
    for _, u := range users {
        if u.active {
            count++
        }
    }
    return count
}

func main() {
    cert := flag.String("cert", "", "TLS certificate.")
    key := flag.String("key", "", "TLS private key.")
    static_dir := flag.String("path", "web/", "Static file directory.")
    flag.Parse()

    var upgrader = websocket.Upgrader{
        ReadBufferSize:  1024,
        WriteBufferSize: 1024,
    }

    http.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
        new_connection, e := upgrader.Upgrade(writer, request, nil)
        if e != nil {
            fmt.Printf("ERROR (Upgrade): %s\n", e)
            return
        }

        new_connection.WriteMessage(websocket.TextMessage,
            []byte(fmt.Sprintf("{\"type\":\"update\",\"player_count\":%d, \"player_target\":%d }", user_count, 10)))

        this_user := user{connection: new_connection, active: true, id: user_count}
        user_count++

        found := false
        for i := range users {
            if !users[i].active {
                users[i] = this_user
            }
        }

        if !found {
            users = append(users, this_user)
        }

        for {
            message_type, message, e := new_connection.ReadMessage()
            if e != nil {
                fmt.Printf("ERROR (ReadMessage): %s\n", e)
                error_code, _ := e.(*websocket.CloseError)
                if error_code.Code == 1001 {
                    this_user.active = false
                }
                return
            }

            if string(message) == "ready" {
                fmt.Printf("Ready!\n")
            } else if string(message) == "spectating" {
                fmt.Printf("Spectating!\n")
            }

            fmt.Printf("%s sent: %s %s\n", new_connection.RemoteAddr(), string(message_type), string(message))

            for _, c := range users {
                if c.active {
                    e = c.connection.WriteMessage(message_type, message)
                    if e != nil {
                        fmt.Printf("ERROR (WriteMessage): %s\n", e)
                    }
                }
            }
        }
    })

    if *cert != "" && *key != "" {
        file_server := http.FileServer(http.Dir(*static_dir))
        http.Handle("/", file_server)

        address := ":443"
        fmt.Printf("Launching HTTPS server on %s, serving files from '%s'.\n", address, *static_dir)
        e := http.ListenAndServeTLS(address, *cert, *key, nil)
        if e != nil {
            fmt.Printf("HTTPS Server Error:\n%s\n", e)
        }

        // Forward http requests to https.
        redirector := http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
            http.Redirect(
                writer,
                request,
                "https://"+request.Host+request.RequestURI,
                http.StatusMovedPermanently)
        })
        redirect_address := ":80"
        fmt.Printf("Launched HTTP -> HTTPS redirect server on %s.\n", redirect_address)
        e = http.ListenAndServe(redirect_address, redirector)
        if e != nil {
            fmt.Printf("HTTP Server Error:\n%s\n", e)
        }
    } else {
        file_server := http.FileServer(http.Dir(*static_dir))
        http.Handle("/", file_server)

        address := ":80"
        fmt.Printf("Launching HTTP server on %s, serving files from '%s'.\n", address, *static_dir)
        e := http.ListenAndServe(address, nil)
        if e != nil {
            fmt.Printf("HTTP Server Error:\n%s\n", e)
        }
    }
}
