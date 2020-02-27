# # build environment
FROM node:12.2.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package.json .
RUN yarn install --ignore-optional --silent
RUN yarn global add ts-node --silent
COPY . .
RUN yarn build
RUN ls

EXPOSE 5000
# COPY docker-entrypoint.sh /app
# ENTRYPOINT ["/app/docker-entrypoint.sh"]
WORKDIR /app/build
CMD node server.js
