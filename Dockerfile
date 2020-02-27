# # build environment
FROM node:12.2.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package.json .
RUN yarn install --ignore-optional --silent
RUN yarn global add ts-node --silent
COPY . .
RUN yarn build

EXPOSE 5000
RUN cd build
CMD [ "node", "server.js" ]
