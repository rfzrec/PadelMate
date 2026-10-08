FROM node:20-alpine
WORKDIR /app

# Compose build context is the project root, so explicitly copy
# the Gateway package files from the gateway directory.
COPY gateway/package*.json ./
RUN npm install --omit=dev

COPY gateway/ ./

EXPOSE 3000
CMD ["npm", "start"]
