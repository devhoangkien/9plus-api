
cd apps/gateway && bun run build && cd -
cd apps/core && bun run build && cd -
cd plugins/payment && bun run build && cd -
docker-compose build --no-cache