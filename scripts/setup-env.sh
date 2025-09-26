#!/bin/bash

set -e

# copy env root
(cp .env.example .env)

# copy env service
(cd "apps/core/" && cp .env.example .env )

# copy env api gateway
(cd "apps/gateway/" && cp .env.example .env )

# copy env payment plugin
(cd "plugins/payment/" && cp .env.example .env )