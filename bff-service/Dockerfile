FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci && npm cache clean --force

FROM node:20-alpine AS run
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY ./app.js .
USER node
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000
CMD ["node", "app.js"]