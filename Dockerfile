FROM node:16.13.0-alpine3.12
WORKDIR /app
COPY . ./
RUN npm install && \
    npm install -g npm@latest
CMD ["npm","start"]