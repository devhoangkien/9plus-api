#!/bin/bash

cd apps/gateway && bun run lint && cd -
cd apps/core && bun run lint && cd -
cd plugins/payment && bun run lint && cd -