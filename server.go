package main

import (
    "flag"
    "fmt"
    "github.com/gorilla/websocket"
    "net/http"
)

func main() {
    cert       := flag.String("cert", "",     "TLS certificate.")
    key        := flag.String("key",  "",     "TLS private key.")
    static_dir := flag.String("path", "web/", "Static file directory.")
    flag.Parse()

    var upgrader = websocket.Upgrader{
        ReadBufferSize:  1024,
        WriteBufferSize: 1024,
    }

    var connections []*websocket.Conn

    http.HandleFunc("/ws", func(writer http.ResponseWriter, request *http.Request) {
        new_connection, e := upgrader.Upgrade(writer, request, nil)
        if e != nil {
            fmt.Printf("ERROR: %s\n", e)
            return
        }

        connections = append(connections, new_connection)

        for {
            message_type, message, e := new_connection.ReadMessage()
            if e != nil {
                fmt.Printf("ERROR (ReadMessage): %s\n", e)
                return
            }

            fmt.Printf("%s sent: %s %s\n",
                new_connection.RemoteAddr(),
                string(message_type),
                string(message))

            for _, c := range connections {
                e = c.WriteMessage(message_type, message)
                if e != nil {
                    fmt.Printf("ERROR (WriteMessage): %s", e)
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
