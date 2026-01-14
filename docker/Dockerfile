# Production stage - serves pre-built dist folder
FROM nginx:alpine

# Copy pre-built dist folder
# Note: You must build the application locally first with `npm run build`
COPY dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
