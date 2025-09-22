
cd apps/api-gateway && bun run build && cd -
cd apps/user-service && bun run build && cd -
docker-compose build --no-cache