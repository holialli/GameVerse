# 1. Use a small, secure Linux image with Node.js
FROM node:20-alpine


WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 5000


CMD ["npm", "start"]