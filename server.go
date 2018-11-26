package main

import (
    "fmt"
    "net/http"
)

func main() {
    static_dir := "web/"
    address := ":80"

    fs := http.FileServer(http.Dir("web/"))
    http.Handle("/", fs)

    fmt.Printf("Launching server on %s, serving files from '%s'.\n", address, static_dir)
    http.ListenAndServe(address, nil)
}
