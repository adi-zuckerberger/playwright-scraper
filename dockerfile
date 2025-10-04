FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Install Playwright browsers and set proper permissions
RUN npx playwright install chromium && \
    chmod -R 755 /ms-playwright

# Copy application code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]