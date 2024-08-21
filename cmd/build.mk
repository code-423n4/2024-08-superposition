
ORG_ROOT := fluidity

INSTALL_DIR := $(or ${INSTALL_DIR},/usr/local/bin)

.PHONY: build watch clean install

MAKEFLAGS += --no-print-directory
