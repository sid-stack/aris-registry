# ARIS Protocol v2.1 - Modular Deployment Engine
FROM node:20-alpine

WORKDIR /app

# Copy root package.json and api package.json
COPY package.json .
COPY api/package.json api/

# Install dependencies (shredded monorepo style)
RUN npm install
RUN cd api && npm install

# Copy source code
COPY . .

# Expose the internal orchestrator port
EXPOSE 8080

# Run the thin orchestrator
CMD ["node", "api/index.js"]
