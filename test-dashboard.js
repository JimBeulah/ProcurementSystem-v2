const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Collect console messages and errors
  const logs = [];
  const errors = [];
  
  page.on('console', msg => {
    logs.push([] );
  });
  
  page.on('pageerror', err => {
    errors.push(err.toString());
  });
  
  try {
    // Navigate to the dashboard
    console.log('Navigating to dashboard...');
    const response = await page.goto('http://localhost:8000/dashboard', { waitUntil: 'networkidle' });
    console.log('Status:', response.status());
    
    // Check page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check if page content loads
    const heading = await page.locator('h1, h2, h3').first().textContent();
    console.log('First heading:', heading);
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-screenshot.png' });
    console.log('Screenshot saved');
    
    // Wait a moment for any async rendering
    await page.waitForLoadState('networkidle');
    
    // Check for the removed components - should NOT be present
    const budgetCard = await page.locator('text=Budget Utilization').count();
    console.log('Budget Utilization card found:', budgetCard);
    
    // Check for console errors
    console.log('Console logs:', logs.length);
    console.log('Console errors:', errors.length);
    
    if (logs.length > 0) {
      logs.forEach(log => console.log('  ' + log));
    }
    
    if (errors.length > 0) {
      errors.forEach(err => console.log('  ERROR: ' + err));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
