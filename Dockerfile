# # build environment
FROM node:12.2.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app/frontend
COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN yarn install --silent &> /dev/null 
# RUN yarn global add ts-node --silent
COPY frontend .
RUN yarn build

WORKDIR /app/backend
COPY backend/package.json .
COPY backend/yarn.lock .
RUN yarn install --silent
COPY backend .
RUN yarn build

RUN ls
RUN ls build

EXPOSE 5000
COPY docker-entrypoint.sh /app
WORKDIR /app/build
ENTRYPOINT ["/app/docker-entrypoint.sh"]
