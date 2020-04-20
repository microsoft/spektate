# # build environment
FROM node:12.2.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package.json .
COPY yarn.lock .
RUN yarn install --silent
RUN ls
RUN pwd
COPY . .
RUN yarn build-prod

WORKDIR /app/build
RUN ls
EXPOSE 5000
COPY docker-entrypoint.sh /app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
