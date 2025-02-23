FROM node:22 AS build

WORKDIR /app
COPY bin/ bin/
COPY resources/ resources/
COPY web/ web/
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
RUN mkdir -p /workspace && chmod -R 777 /workspace

FROM gcr.io/distroless/nodejs22-debian12
COPY --from=build /app /app
COPY --from=build /workspace /workspace
WORKDIR /workspace
ENTRYPOINT ["/nodejs/bin/node", "/app/bin/kuvia.js"]
