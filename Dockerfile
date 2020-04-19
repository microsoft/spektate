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
COPY frontend/node_modules /app/node_modules/
RUN ls

WORKDIR /app/backend
COPY backend/package.json .
COPY backend/yarn.lock .
RUN yarn install --silent
COPY backend .
RUN yarn build
COPY backend/node_modules /app/node_modules/
RUN ls

WORKDIR /app/build
RUN ls
EXPOSE 5000
COPY docker-entrypoint.sh /app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
