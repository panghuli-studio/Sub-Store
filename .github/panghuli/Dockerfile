# Mirrors the layers of upstream's xream/sub-store image (node alpine + bundle + front-end
# dist, same CMD and paths), so upstream's docker docs and env vars apply unchanged.
ARG NODE_VERSION=24.22.1
FROM node:${NODE_VERSION}-alpine

ENV TIME_ZONE=Asia/Shanghai
WORKDIR /opt/app

RUN apk add --no-cache curl tzdata git procps openssl ca-certificates \
    && update-ca-certificates \
    && cp /usr/share/zoneinfo/$TIME_ZONE /etc/localtime \
    && echo $TIME_ZONE > /etc/timezone

COPY backend/dist/sub-store.bundle.js /opt/app/sub-store.bundle.js
COPY frontend /opt/app/frontend

# Runs as root like upstream: the data dir is a mounted volume and upstream's image does
# not set a user, so a non-root user would need chown on every existing deployment.
CMD ["/bin/sh", "-c", "mkdir -p /opt/app/data; cd /opt/app/data; SUB_STORE_DOCKER=true SUB_STORE_FRONTEND_PATH=/opt/app/frontend SUB_STORE_DATA_BASE_PATH=/opt/app/data node /opt/app/sub-store.bundle.js"]
