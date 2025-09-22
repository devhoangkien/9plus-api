#!/bin/bash

cd apps/api-gateway && bun run lint && cd -
cd apps/user-service && bun run lint && cd -