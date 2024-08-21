#!/bin/sh -u

timestamp="$(date +%s)"

name="$1"

name="migrations/${timestamp}-${name}.sql"

cat >"$name" <<EOF
-- migrate:up

-- migrate:down
EOF

$EDITOR "$name"
