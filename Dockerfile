
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build


FROM node:20-alpine
WORKDIR /app
# Remove npm once serve is installed, for the same reason as in server/dockerfile.
RUN npm install -g serve \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /root/.npm

COPY --from=build /app/build ./build
EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]