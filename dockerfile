FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Install Playwright browsers
RUN npx playwright install chromium

# Copy application code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]