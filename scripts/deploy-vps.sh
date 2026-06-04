#!/usr/bin/env bash
# Build the Taysir image locally and deploy it to the Oracle VPS.
# The VPS has only ~1 GB RAM, so we DO NOT build there — we ship the image.
#
# Usage:
#   VPS_IP=130.x.x.x ./scripts/deploy-vps.sh
# Optional:
#   VPS_USER=ubuntu  SSH_KEY=~/.ssh/id_ed25519  REMOTE_DIR=~/taysir  APP_URL=http://130.x.x.x:3000
set -euo pipefail

VPS_IP="${VPS_IP:?Set VPS_IP=<public ip of the VPS>}"
VPS_USER="${VPS_USER:-ubuntu}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_DIR="${REMOTE_DIR:-/home/${VPS_USER}/taysir}"
APP_URL="${APP_URL:-http://${VPS_IP}:3000}"
IMAGE="taysir:latest"
SSH="ssh -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new ${VPS_USER}@${VPS_IP}"

echo "==> [1/5] Building image locally (NEXT_PUBLIC_APP_URL=${APP_URL})"
docker build --build-arg "NEXT_PUBLIC_APP_URL=${APP_URL}" -t "${IMAGE}" .

echo "==> [2/5] Ensuring remote dir + checking .env.production on VPS"
${SSH} "mkdir -p ${REMOTE_DIR}"
if ! ${SSH} "test -f ${REMOTE_DIR}/.env.production"; then
  echo "!! ${REMOTE_DIR}/.env.production missing on the VPS."
  echo "   Copy the template and fill it first:"
  echo "     scp -i ${SSH_KEY} .env.production.example ${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/.env.production"
  echo "     ${SSH} 'nano ${REMOTE_DIR}/.env.production'"
  exit 1
fi

echo "==> [3/5] Shipping image (gzip stream over SSH — no registry needed)"
docker save "${IMAGE}" | gzip | ${SSH} "gunzip | docker load"

echo "==> [4/5] Copying docker-compose.yml"
scp -i "${SSH_KEY}" docker-compose.yml "${VPS_USER}@${VPS_IP}:${REMOTE_DIR}/docker-compose.yml"

echo "==> [5/5] Starting stack + tailing logs (Ctrl-C to stop tailing; app keeps running)"
${SSH} "cd ${REMOTE_DIR} && docker compose --env-file .env.production up -d && docker compose --env-file .env.production ps"
echo "----- LIVE LOGS (Ctrl-C to detach) -----"
${SSH} "cd ${REMOTE_DIR} && docker compose --env-file .env.production logs -f --tail=200"
