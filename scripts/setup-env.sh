#!/bin/bash

set -e

# copy env root
(cp example.env .env)

# copy env service
(cd "apps/core-service/" && cp example.env .env )

# copy env api gateway
(cd "apps/api-gateway/" && cp example.env .env )