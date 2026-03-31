# Use Node.js 20 LTS (Alpine for smaller image size)
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Install global Expo CLI
RUN npm install -g expo-cli

# Copy package.json and package-lock.json first for better cache utilization
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Expose the standard Expo Metro Bundler port
EXPOSE 8081

# Start the Expo development server
CMD ["npx", "expo", "start"]
