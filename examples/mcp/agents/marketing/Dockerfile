FROM node:24-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3005
ENV HOST=0.0.0.0

CMD ["npm", "start"]
