FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Verify Playwright browsers are available
RUN npx playwright --version && \
    ls -la /ms-playwright/ || echo "No /ms-playwright directory found"

# Copy application code
COPY . .

EXPOSE 3000

CMD ["npm", "start"]