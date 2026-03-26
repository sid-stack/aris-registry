# ARIS Protocol v2.2 - Unified Build Engine
FROM node:20-alpine

WORKDIR /app

# Copy root package management files first for better caching
COPY package*.json ./

# Install ALL dependencies
RUN npm install --legacy-peer-deps

# Copy source code (respecting .dockerignore)
COPY . .

# Build the React frontend
RUN npm run build

# Expose the internal orchestrator port
EXPOSE 8080

# Run the unified orchestrator
CMD ["node", "api/index.js"]

