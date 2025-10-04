const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if Chromium is installed, if not, install it
const chromiumPath = path.join(process.env.HOME || '/root', '.cache/ms-playwright/chromium_headless_shell-1193');

if (!fs.existsSync(chromiumPath)) {
  console.log('Chromium not found, installing...');
  try {
    execSync('npx playwright install chromium --with-deps', { stdio: 'inherit' });
    console.log('Chromium installed successfully');
  } catch (error) {
    console.error('Failed to install Chromium:', error);
  }
}

const express = require('express');
const { chromium } = require('playwright');

const app = express();
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Playwright scraper is running' });
});

// Main scraping endpoint
app.post('/scrape', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL required in body' });
  }

  console.log('Scraping:', url);
  let browser;
  
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Navigate to page
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('Page loaded, scrolling...');
    
    // Scroll to load ads
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.scrollTo(0, 3000));
    await page.waitForTimeout(2000);
    
    console.log('Extracting ads...');
    
    // Extract Taboola ads
    const ads = await page.evaluate(() => {
      const adElements = document.querySelectorAll('[aria-label*="Taboola Advertising Unit"]');
      
      return Array.from(adElements).map((el, index) => {
        const bgImage = window.getComputedStyle(el).backgroundImage;
        const urlMatch = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        const imageUrl = urlMatch ? urlMatch[1] : null;
        
        // Get link URL if available
        const link = el.closest('a');
        const linkUrl = link ? link.href : null;
        
        return {
          image_url: imageUrl,
          ad_destination_url: linkUrl,
          page_url: window.location.href,
          index: index
        };
      }).filter(ad => ad.image_url);
    });
    
    console.log(`Found ${ads.length} ads`);
    
    await browser.close();
    
    res.json({ 
      success: true,
      ads, 
      count: ads.length 
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    if (browser) await browser.close();
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Playwright scraper running on port ${PORT}`);
});