FROM node:20-alpine

WORKDIR /app/server

COPY server/package.json server/package-lock.json* ./
RUN npm install

COPY server/prisma ./prisma
RUN npx prisma generate

COPY server/ .

CMD ["sh", "-c", "npx prisma db push && npx tsx watch src/index.ts"]
