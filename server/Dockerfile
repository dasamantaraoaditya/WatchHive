# Use Node.js 20 LTS
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy built files from local (or build in container)
# Since we have a build script, let's copy everything and build
COPY . .
RUN npm install
RUN npm run build

# Expose port (Railway provides PORT env var)
EXPOSE 8080

# Environment variables (Railway injects them)
ENV NODE_ENV=production

# Start the server
CMD ["npm", "run", "start"]
