package main

import (
	"bufio"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/pkg/errors"
)

var line strings.Builder

func main() {
	if len(os.Args) != 2 {
		fmt.Printf("Expect 1 arg, get %d\n", len(os.Args)-1)
		fmt.Printf("Usage: %v /path/to/file\n", os.Args[0])
		return
	}

	go func() {
		if err := readFile(os.Args[1]); err != nil {
			fmt.Printf("%v\n", err)
		}
	}()

	http.HandleFunc("/api/log", handler)
	http.ListenAndServe(":6657", nil)
}

func handler(w http.ResponseWriter, _ *http.Request) {
	fmt.Fprint(w, line.String())
}

func readFile(path string) error {
	file, err := os.Open(path)
	defer func() {
		if err := file.Close(); err != nil {
			fmt.Printf("%v\n", errors.Wrap(err, "failed to close reader"))
		}
	}()
	if err != nil {
		return errors.Wrap(err, "failed to open reader")
	}

	reader := bufio.NewReader(file)

	ticker := time.NewTicker(time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// read until eof
		for {
			content, err := reader.ReadString('\n')
			if err != nil && err != io.EOF {
				return errors.Wrap(err, "failed to read from reader")
			}
			line.WriteString(content)
			if err == io.EOF {
				break
			}
		}
	}

	return nil
}
