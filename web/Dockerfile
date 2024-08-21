
FROM alpine:3.19.1 AS build

RUN apk add --no-cache \
	nodejs \
	npm \
	yarn

WORKDIR /usr/local/src/superposition/web

COPY package.json .

RUN ls

RUN pnpm i

COPY . .

RUN pnpm run build

FROM nginx:stable-alpine3.19 AS runner

COPY --from=build /usr/local/src/superposition/web /var/www/html

RUN echo "server {listen 80 default_server;listen [::]:80 default_server;root /var/www/html;index index.html;server_name long.so;location / {try_files $uri /index.html;}}" > /etc/nginx/http.d/default.conf
