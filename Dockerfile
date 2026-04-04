FROM nginx:1.25-alpine

COPY dist/dev-tool-web/browser /usr/share/nginx/html

COPY cicd/config/nginx.conf /etc/nginx/conf.d/default.conf

RUN echo "Files in /usr/share/nginx/html:" && ls -lah /usr/share/nginx/html
