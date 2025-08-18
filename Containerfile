# Build the application
FROM node:22-slim AS build

## Install dependencies
WORKDIR /home/node/app
COPY . .
RUN npm ci

## Build Gaze Server using the build script
RUN npm run build

# Start the application
FROM node:22-slim AS start

## Install dependencies
WORKDIR /home/node/app
COPY --from=build /home/node/app/dist ./dist
COPY --from=build /home/node/app/package.json ./package.json
COPY --from=build /home/node/app/package-lock.json ./package-lock.json
RUN npm ci --omit=dev

## Expose the port
ARG PORT="4001"
ENV APP_PORT=${PORT}
EXPOSE ${PORT}

## Run the application as the node user to protect system files
USER node
CMD [ "npm", "start" ]