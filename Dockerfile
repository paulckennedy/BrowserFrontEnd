# Multi-stage build for production-ready markdown editor
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Production stage with Nginx
FROM nginx:alpine

# Install Node.js for any server-side processing if needed
RUN apk add --no-cache nodejs npm

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy application files
COPY --from=builder /app/node_modules ./node_modules
COPY . /usr/share/nginx/html

# Create directory for application data
RUN mkdir -p /app/data

# Set proper permissions
RUN chown -R nginx:nginx /usr/share/nginx/html /app/data

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]