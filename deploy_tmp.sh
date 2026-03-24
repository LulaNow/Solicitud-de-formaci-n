#!/bin/bash
cd /opt/instancia_sso
docker compose -f docker-compose.production.yml up -d --build --force-recreate
echo "DEPLOY_COMPLETE"
