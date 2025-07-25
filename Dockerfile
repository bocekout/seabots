FROM node:20

WORKDIR /app

# Copy only package.json to install deps (layer cache)
COPY package*.json ./

RUN npm install

# No COPY . . — use volume mount instead

EXPOSE 5173

# dockerdev is the script to run Vite with host binding setup in package.json
CMD ["npm", "run", "dockerdev"]
