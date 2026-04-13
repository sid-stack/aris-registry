# ARIS Protocol v2.2 - Unified Build Engine
FROM node:20-alpine

WORKDIR /app

# Copy root package management files first for better caching
COPY package*.json ./

# Install ALL dependencies
RUN npm install --legacy-peer-deps

# Declare build-time vars so Vite can bake them into the bundle
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_STRIPE_PUBLIC_KEY
ARG VITE_ACCESS_KEY
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST
ARG VITE_ADSENSE_CLIENT
ARG VITE_API_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY
ENV VITE_ACCESS_KEY=$VITE_ACCESS_KEY
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST
ENV VITE_ADSENSE_CLIENT=$VITE_ADSENSE_CLIENT
ENV VITE_API_URL=$VITE_API_URL

# Copy source code (respecting .dockerignore)
COPY . .

# Build the React frontend
RUN npm run build

# Expose the internal orchestrator port
EXPOSE 8080

# Run the unified orchestrator
CMD ["node", "api/index.js"]

