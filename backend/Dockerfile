FROM node:10

# Create app directory
WORKDIR /app

COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock

RUN yarn
COPY . /app
RUN yarn build

# Bundle app source
COPY . .

EXPOSE 8080
CMD [ "ts-node", "src/index.ts" ]