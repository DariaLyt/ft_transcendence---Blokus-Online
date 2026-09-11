# Uses node version 22 as our base image
FROM node:22-slim

# Goes to the app directory
WORKDIR /app

# Install OpenSSL for HTTPS certificate generation
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm ci

# Copy the rest of our app into the container
COPY . .

# Set port environment variable
ENV PORT=3000

# Expose the port so our computer can access it
EXPOSE 3000

# Run the app
CMD ["npm", "start"]