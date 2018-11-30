package main

import (
    "flag"
    "fmt"
    "github.com/gorilla/websocket"
    "net/http"
)

func main() {
    cert := flag.String("cert", "", "TLS certificate.")
    key  := flag.String("key",  "", "TLS private key.")
    flag.Parse();

    var upgrader = websocket.Upgrader {
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
                if (e != nil) {
                    fmt.Printf("ERROR (WriteMessage): %s", e)
                }
            }
        }
    })

    address := ":443"
    static_dir := "web/"
    fs := http.FileServer(http.Dir(static_dir))
    http.Handle("/", fs)
    fmt.Printf("Launching server on %s, serving files from '%s'.\n", address, static_dir)
    http.ListenAndServeTLS(address, *cert, *key, nil)

    // Forward http requests to https.

    redirector := http.HandlerFunc(func (writer http.ResponseWriter, request *http.Request) {
        http.Redirect(
            writer,
            request,
            "https://" + request.Host + request.RequestURI,
            http.StatusMovedPermanently)
    });
    http.ListenAndServe(":80", redirector);

}
