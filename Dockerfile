FROM node:16.13.0-alpine3.12
WORKDIR /home/node/app
COPY . .
RUN npm install && \
    npm install -g npm@9.6.6
CMD ["npm","start"]