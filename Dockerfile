# backend environment
FROM node:12.2.0-alpine as backend
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app
COPY backend/package.json .
COPY backend/yarn.lock .
RUN yarn install --silent
COPY backend .
RUN yarn build-prod
RUN ls
RUN pwd
WORKDIR /app/build
RUN ls 

# frontend environment
FROM node:12.2.0-alpine as frontend
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app/frontend
COPY frontend/package.json .
COPY frontend/yarn.lock .
RUN yarn install --silent &> /dev/null 
COPY frontend .
RUN yarn build-prod
RUN ls
RUN pwd
WORKDIR /app/build
RUN ls 

# prod environment
FROM node:12.2.0-alpine as production
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY --from=backend /app/build /app/build
COPY --from=backend /app/node_modules /app/node_modules
COPY --from=frontend /app/build /app/build
COPY --from=frontend /app/node_modules /app/node_modules
WORKDIR /app/build
RUN ls
EXPOSE 5000
COPY docker-entrypoint.sh /app
ENTRYPOINT ["/app/docker-entrypoint.sh"]
