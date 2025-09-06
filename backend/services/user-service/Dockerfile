# --- DEV STAGE ---
FROM node:20-alpine AS dev
WORKDIR /app
COPY package*.json ./   
RUN npm install      
# cài cả devDependencies
CMD ["npm", "run", "dev"]



# --- PROD STAGE ---
FROM node:20-alpine AS prod
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3001
CMD ["node", "src/index.js"]