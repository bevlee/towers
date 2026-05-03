#!/bin/sh
echo "window.__ENV__ = { SERVER_URL: \"${SERVER_URL:-http://localhost:3001}\", PB_URL: \"${PB_URL:-http://localhost:8090}\" };" \
  > /usr/share/nginx/html/env.js
exec nginx -g "daemon off;"
