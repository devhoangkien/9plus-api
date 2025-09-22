
cd apps/api-gateway && bun run build && cd -
cd apps/core-service && bun run build && cd -
docker-compose build --no-cache