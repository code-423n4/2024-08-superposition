
.PHONY: build contract docker docker-graphql docker-ingestor

all: build

build: contract

contract:
	@cd pkg && make

docker: docker-graphql docker-ingestor

docker-graphql:
	@docker build -t superposition/graphql -f Dockerfile.graphql .

docker-ingestor:
	@docker build -t superposition/ingestor -f Dockerfile.ingestor .
