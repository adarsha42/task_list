FROM node:24-bookworm-slim

WORKDIR /app

RUN npm install -g pnpm@11.9.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
