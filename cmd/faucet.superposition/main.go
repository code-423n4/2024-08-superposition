package main

//go:generate go run github.com/99designs/gqlgen generate
//

import (
	"context"
	_ "embed"
	"net/http"
	"os"

	"github.com/fluidity-money/long.so/lib/config"
	"github.com/fluidity-money/long.so/lib/features"
	"github.com/fluidity-money/long.so/lib/setup"

	"github.com/fluidity-money/long.so/cmd/faucet.superposition/graph"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"

	gormSlog "github.com/orandin/slog-gorm"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"
)

const (
	// EnvBackendType to use to listen the server with, (http|lambda).
	EnvBackendType = "SPN_LISTEN_BACKEND"

	// EnvListenAddr to listen the HTTP server on.
	EnvListenAddr = "SPN_LISTEN_ADDR"

	// EnvTurnstileSecret to use to prevent spam.
	EnvTurnstileSecret = "SPN_TURNSTILE_SECRET"
)

// XForwardedFor to load as a cache key in the context for use
const XForwardedFor = "X-Forwarded-For"

type requestMiddleware struct {
	srv *handler.Server
}

func (m requestMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	ipAddr := r.Header.Get(XForwardedFor)
	ctx := context.WithValue(r.Context(), XForwardedFor, ipAddr)
	m.srv.ServeHTTP(w, r.WithContext(ctx))
}

func main() {
	defer setup.Flush()
	turnstileSecret := os.Getenv(EnvTurnstileSecret)
	if turnstileSecret == "" {
		setup.Exitf("turnstile secret empty. set %v", EnvTurnstileSecret)
	}
	config := config.Get()
	db, err := gorm.Open(postgres.Open(config.PickTimescaleUrl()), &gorm.Config{
		DisableAutomaticPing: true,
		Logger:               gormSlog.New(),
	})
	if err != nil {
		setup.Exitf("database open: %v", err)
	}
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{
		Resolvers: &graph.Resolver{
			DB:              db,
			F:               features.Get(),
			C:               config,
			TurnstileSecret: turnstileSecret,
		},
	}))
	// Add a custom transport so we can access the requesting IP address in a context.
	http.Handle("/", requestMiddleware{srv})
	http.Handle("/playground", playground.Handler("Faucet playground", "/"))
	switch typ := os.Getenv(EnvBackendType); typ {
	case "lambda":
		lambda.Start(httpadapter.New(http.DefaultServeMux).ProxyWithContext)
	case "http":
		err := http.ListenAndServe(os.Getenv(EnvListenAddr), nil)
		setup.Exitf( // This should only return if there's an error.
			"err listening, %#v not set?: %v",
			EnvListenAddr,
			err,
		)
	default:
		setup.Exitf(
			"unexpected listen type: %#v, use either (lambda|http) for SPN_LISTEN_BACKEND",
			typ,
		)
	}
}
