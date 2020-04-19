# # build environment
FROM node:12.2.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app/frontend
COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN yarn install --silent &> /dev/null 
COPY frontend .
RUN yarn build

WORKDIR /app/backend
COPY backend/package.json .
COPY backend/yarn.lock .
RUN yarn install --silent
COPY backend .
RUN yarn build

WORKDIR /app/build
RUN ls
EXPOSE 5000
COPY docker-entrypoint.sh /app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
