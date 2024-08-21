package main

//go:generate go run github.com/99designs/gqlgen generate

import (
	"net/http"
	"os"

	"github.com/fluidity-money/long.so/lib/config"
	"github.com/fluidity-money/long.so/lib/features"
	"github.com/fluidity-money/long.so/lib/setup"

	"github.com/fluidity-money/long.so/cmd/graphql.ethereum/graph"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/playground"

	"github.com/ethereum/go-ethereum/ethclient"

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
)

type corsMiddleware struct {
	srv *handler.Server
}

func (m corsMiddleware) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "*")
	m.srv.ServeHTTP(w, r)
}

func main() {
	defer setup.Flush()
	config := config.Get()
	db, err := gorm.Open(postgres.Open(config.PickTimescaleUrl()), &gorm.Config{
		DisableAutomaticPing: true,
		Logger:               gormSlog.New(), // Use default slog
	})
	if err != nil {
		setup.Exitf("database open: %v", err)
	}
	geth, err := ethclient.Dial(config.GethUrl)
	if err != nil {
		setup.Exitf("geth open: %v", err)
	}
	defer geth.Close()
	srv := handler.NewDefaultServer(graph.NewExecutableSchema(graph.Config{
		Resolvers: &graph.Resolver{
			DB:          db,
			F:           features.Get(),
			Geth:        geth,
			C:           config,
			PoolsConfig: PoolsConfig,
		},
	}))
	http.Handle("/", corsMiddleware{srv})
	http.Handle("/playground", playground.Handler("Longtail playground", "/"))
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
