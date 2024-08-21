
include ../build.mk

ORG_ROOT := superposition

GO_BUILD := CGO_ENABLED=0 go build

GO_FILES := $(shell find . -name '*.go' -or -name '*.json' -type f)

CMDLET := $(shell basename ${PWD})

CONFIG_DIR := ../../config

${CMDLET}: ${EXTRA_FILES} ${GO_FILES}
	@${GO_BUILD} ${GO_BUILD_EXTRA_ARGS}

lint: ${GO_FILES}
	@${GO_FMT}

test: ${GO_FILES} semgrep
	@${GO_TEST} -cover

build: ${CMDLET}

install: build
	cp ${CMDLET} ${INSTALL_DIR}/${CMDLET}

watch:
	@ls -1 ${GO_FILES} | entr -ns 'clear && make build'

clean:
	@rm -f "${CMDLET}" lint test docker ${EXTRA_FILES}
