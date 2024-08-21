// setup: contains simple functions for setting up the logging library,
// as well as the database.

package setup

import (
	"fmt"
	"log"
	"log/slog"
	"os"
	"context"
	"runtime/debug"
	"strings"
	"time"

	"github.com/getsentry/sentry-go"
	slogsentry "github.com/samber/slog-sentry/v2"
)

const (
	// EnvDebug for enabling debug printing of messages.
	EnvDebug = "SPN_DEBUG"

	// EnvSentryDsn to use for logging sentry-related messages.
	EnvSentryDsn = "SPN_SENTRY_DSN"
)

type Multihandler struct {
	sentry, json slog.Handler
}

func (h Multihandler) Enabled(ctx context.Context, record slog.Level) bool {
	// The JSON handler should be the furthest we're going.
	return h.json.Enabled(ctx, record)
}
func (h Multihandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	var s slog.Handler
	if h.sentry != nil {
		s = h.sentry.WithAttrs(attrs)
	}
	return Multihandler{
		sentry: s,
		json: h.json.WithAttrs(attrs),
	}
}
func (h Multihandler) WithGroup(name string) slog.Handler {
	var s slog.Handler
	if h.sentry != nil {
		s = h.sentry.WithGroup(name)
	}
	return Multihandler{
		sentry: s,
		json: h.json.WithGroup(name),
	}
}
func (h Multihandler) Handle(ctx context.Context, record slog.Record) error {
	if s := h.sentry; s != nil {
		if err := s.Handle(ctx, record); err != nil {
			return err
		}
	}
	return h.json.Handle(ctx, record)
}

func init() {
	// Set up the logging to print JSON blobs.
	logLevel := slog.LevelInfo
	if os.Getenv(EnvDebug) != "" {
		logLevel = slog.LevelDebug
	}
	// Set up Sentry, if it's enabled.
	dsn := os.Getenv(EnvSentryDsn)
	if dsn != "" {
		err := sentry.Init(sentry.ClientOptions{
			Dsn:           dsn,
			EnableTracing: false,
		})
		if err != nil {
			panic(fmt.Sprintf("failed to set up sentry: %v", err))
		}
	}
	var multihandler Multihandler
	if dsn != "" { // DSN being set means we're using Sentry.
		// We want to only track errors with Sentry.
		multihandler.sentry = slogsentry.Option{
			Level: slog.LevelError,
		}.
			NewSentryHandler()
	}
	multihandler.json = slog.NewJSONHandler(os.Stderr, &slog.HandlerOptions{
		Level: logLevel,
	})
	logger := slog.New(multihandler)
	// Find the commit hash (taken straight from
	// https:icinga.com/blog/2022/05/25/embedding-git-commit-information-in-go-binaries/)
	var revision string
	if info, ok := debug.ReadBuildInfo(); ok {
		for _, setting := range info.Settings {
			if setting.Key == "vcs.revision" {
				revision = setting.Value
				break
			}
		}
	}
	logger.
		With("revision", revision).
		With("environment", "backend").
		With("command line", strings.Join(os.Args, ",")).
		With("is debug", logLevel == slog.LevelDebug)
	slog.SetDefault(logger)
}

func Flush() {
	sentry.Flush(2 * time.Second)
}

func Exit() {
	Flush()
	os.Exit(1)
}
func Exitf(s string, f ...any) {
	log.Printf(s, f...)
	Exit()
}
