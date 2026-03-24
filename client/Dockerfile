FROM node:20-alpine

WORKDIR /app/client

COPY client/package.json client/package-lock.json* ./
RUN npm install

COPY client/ .

CMD ["npx", "vite", "--host"]
