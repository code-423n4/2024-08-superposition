// heartbeat: notify a system upstream that we're alive by making a HTTP
// request. Optionally configured with environment variable
// SPN_HEARTBEAT_URL.

package heartbeat

import (
	"log/slog"
	"net/http"
	"os"
)

// EnvHeartbeatUrl to optionally send a GET to on request.
const EnvHeartbeatUrl = "SPN_HEARTBEAT_URL"

var urls = make(chan string)

func Pulse() {
	u := <-urls
	if u == "" {
		slog.Debug("skipping request to send message to heartbeat url")
		return
	}
	slog.Debug("sending a heartbeat message")
	resp, err := http.Get(u)
	if err != nil {
		slog.Error("error reporting to heartbeat", "err", err)
		return
	}
	resp.Body.Close()
}

func init() {
	s := os.Getenv(EnvHeartbeatUrl)
	if s == "" {
		slog.Info("heartbeat imported, but empty env", "env", EnvHeartbeatUrl)
	}
	go func() {
		for {
			urls <- s
		}
	}()
}
