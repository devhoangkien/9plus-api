#!/bin/bash

set -e

# copy env root
(cp example.env .env)

# copy env service
(cd "apps/core/" && cp example.env .env )

# copy env api gateway
(cd "apps/gateway/" && cp example.env .env )

# copy env payment plugin
(cd "plugins/payment/" && cp example.env .env )