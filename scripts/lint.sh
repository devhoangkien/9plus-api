#!/bin/bash

cd apps/api-gateway && bun run lint && cd -
cd apps/core-service && bun run lint && cd -