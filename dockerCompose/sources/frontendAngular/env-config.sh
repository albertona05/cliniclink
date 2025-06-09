#!/bin/bash

# Reemplazar variables de entorno en env.js
envsubst < /app/src/assets/env.js > /app/src/assets/env.js.tmp
mv /app/src/assets/env.js.tmp /app/src/assets/env.js

# Ejecutar el comando original
exec "$@"