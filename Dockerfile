FROM nginx:1.25-alpine

COPY dist/dev-tool-web/browser /usr/share/nginx/html
RUN mkdir -p /usr/share/nginx/html/storybook && echo "<html><body>Storybook disabled</body></html>" > /usr/share/nginx/html/storybook/index.html

COPY cicd/config/nginx.conf /etc/nginx/conf.d/default.conf

RUN echo "Files in /usr/share/nginx/html:" && ls -lah /usr/share/nginx/html
