# # build environment
FROM node:12.2.0-alpine as build
WORKDIR /app

COPY package.json /app/package.json
RUN yarn install --ignore-optional --silent
RUN yarn global add ts-node --silent
COPY . /app
RUN yarn build

EXPOSE 5000
CMD [ "node", "server.js" ]
