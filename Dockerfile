FROM nginx:1.25-alpine

# Copy app đã build vào nginx
COPY dist/develop-tool-portal-web/browser /usr/share/nginx/html

COPY cicd/config/nginx.conf /etc/nginx/conf.d/default.conf

RUN echo "🔍 Files in /usr/share/nginx/html:" && ls -lah /usr/share/nginx/html
