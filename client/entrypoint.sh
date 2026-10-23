#!/bin/sh
echo "window.__ENV__ = { SERVER_URL: \"${SERVER_URL:-http://localhost:3001}\", AUTH_URL: \"${AUTH_URL:-https://auth.bevsoft.com}\" };" \
  > /usr/share/nginx/html/env.js
exec nginx -g "daemon off;"
