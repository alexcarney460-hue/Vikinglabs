FROM node:18-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --production || npm i --production
COPY . .
CMD ["node","agent.js"]
