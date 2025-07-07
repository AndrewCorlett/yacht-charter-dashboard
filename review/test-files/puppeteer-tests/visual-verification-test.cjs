#!/usr/bin/env node

/**
 * Visual Verification Test
 * 
 * This script creates a visual test to manually verify the application functionality
 * before the 15% scaling changes.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class VisualVerificationTest {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      screenshots: [],
      findings: [],
      errors: []
    };
  }

  async initialize() {
    console.log('🔍 Starting Visual Verification Test...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1400, height: 900 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 500 // Slow down actions for better observation
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor console errors
    this.page.on('console', (message) => {
      if (message.type() === 'error') {
        this.results.errors.push({
          timestamp: new Date().toISOString(),
          text: message.text()
        });
      }
    });

    await this.page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  }

  async takeScreenshot(description) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `visual-${description}-${timestamp}.png`;
    const filepath = path.join(process.cwd(), 'test-screenshots', 'visual-verification', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await this.page.screenshot({ path: filepath, fullPage: true });
    
    this.results.screenshots.push({
      description,
      filename,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📸 Screenshot: ${description}`);
  }

  async inspectCurrentPage() {
    // Get page info
    const pageInfo = await this.page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        readyState: document.readyState,
        elementsFound: {
          sidebar: !!document.querySelector('[data-testid="sidebar"]'),
          mainContent: !!document.querySelector('main'),
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          navigation: document.querySelectorAll('nav').length
        },
        sidebarInfo: (() => {
          const sidebar = document.querySelector('[data-testid="sidebar"]');
          if (sidebar) {
            return {
              width: sidebar.offsetWidth,
              isVisible: sidebar.offsetParent !== null,
              buttonsText: Array.from(sidebar.querySelectorAll('button')).map(btn => btn.textContent.trim()).filter(text => text)
            };
          }
          return null;
        })()
      };
    });
    
    this.results.findings.push({
      type: 'page-inspection',
      timestamp: new Date().toISOString(),
      data: pageInfo
    });
    
    console.log('🔍 Page Info:', JSON.stringify(pageInfo, null, 2));
    return pageInfo;
  }

  async testSidebarInteraction() {
    console.log('\n🎯 Testing Sidebar Interaction...');
    
    await this.takeScreenshot('01-initial-state');
    
    const initialInfo = await this.inspectCurrentPage();
    
    if (initialInfo.sidebarInfo) {
      console.log(`📏 Sidebar width: ${initialInfo.sidebarInfo.width}px`);
      console.log(`🔘 Sidebar buttons: ${initialInfo.sidebarInfo.buttonsText.join(', ')}`);
      
      // Try to expand sidebar if collapsed
      if (initialInfo.sidebarInfo.width <= 50) {
        console.log('🔄 Expanding sidebar...');
        try {
          await this.page.click('[data-testid="sidebar-toggle"]');
          await new Promise(resolve => setTimeout(resolve, 1000));
          await this.takeScreenshot('02-sidebar-expanded');
          
          const expandedInfo = await this.inspectCurrentPage();
          console.log(`📏 Expanded sidebar width: ${expandedInfo.sidebarInfo.width}px`);
        } catch (error) {
          console.log('❌ Failed to expand sidebar:', error.message);
        }
      }
      
      // Try clicking each navigation button
      const buttons = ['Dashboard', 'Bookings', 'Settings', 'Admin Config'];
      for (const buttonText of buttons) {
        try {
          console.log(`🔘 Testing ${buttonText} button...`);
          
          const clicked = await this.page.evaluate((text) => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const button = buttons.find(btn => btn.textContent.includes(text));
            if (button) {
              button.click();
              return true;
            }
            return false;
          }, buttonText);
          
          if (clicked) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            await this.takeScreenshot(`03-after-${buttonText.toLowerCase().replace(' ', '-')}-click`);
            
            const pageAfterClick = await this.inspectCurrentPage();
            this.results.findings.push({
              type: 'navigation-test',
              button: buttonText,
              success: true,
              timestamp: new Date().toISOString(),
              pageInfo: pageAfterClick
            });
          } else {
            console.log(`❌ Could not find ${buttonText} button`);
            this.results.findings.push({
              type: 'navigation-test',
              button: buttonText,
              success: false,
              error: 'Button not found'
            });
          }
        } catch (error) {
          console.log(`❌ Error testing ${buttonText}:`, error.message);
        }
      }
    } else {
      console.log('❌ Sidebar not found');
    }
  }

  async testMainContent() {
    console.log('\n🎯 Testing Main Content Areas...');
    
    // Look for key components
    const components = await this.page.evaluate(() => {
      const selectors = [
        '.sitrep',
        '.calendar',
        '.booking-list',
        '.settings',
        '.admin',
        '[data-testid*="sitrep"]',
        '[data-testid*="calendar"]',
        '[data-testid*="booking"]',
        '.quick-create',
        '.timeline-calendar',
        '.yacht-timeline'
      ];
      
      const found = {};
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          found[selector] = {
            count: elements.length,
            visible: Array.from(elements).some(el => el.offsetParent !== null)
          };
        }
      });
      
      return found;
    });
    
    console.log('🔍 Components found:', JSON.stringify(components, null, 2));
    
    this.results.findings.push({
      type: 'component-detection',
      timestamp: new Date().toISOString(),
      components
    });
    
    await this.takeScreenshot('04-main-content-analysis');
  }

  async testResponsiveDesign() {
    console.log('\n🎯 Testing Responsive Design...');
    
    const viewports = [
      { name: 'Desktop', width: 1400, height: 900 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 }
    ];
    
    for (const viewport of viewports) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      await this.page.setViewport(viewport);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const responsiveInfo = await this.page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
          hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          sidebarVisible: (() => {
            const sidebar = document.querySelector('[data-testid="sidebar"]');
            return sidebar ? sidebar.offsetParent !== null : false;
          })()
        };
      });
      
      await this.takeScreenshot(`05-responsive-${viewport.name.toLowerCase()}`);
      
      this.results.findings.push({
        type: 'responsive-test',
        viewport: viewport.name,
        dimensions: `${viewport.width}x${viewport.height}`,
        timestamp: new Date().toISOString(),
        info: responsiveInfo
      });
      
      console.log(`  📊 Overflow: ${responsiveInfo.hasHorizontalOverflow ? 'YES' : 'NO'}`);
      console.log(`  📋 Sidebar visible: ${responsiveInfo.sidebarVisible ? 'YES' : 'NO'}`);
    }
    
    // Reset to desktop
    await this.page.setViewport({ width: 1400, height: 900 });
  }

  async testFormInteractions() {
    console.log('\n🎯 Testing Form Interactions...');
    
    // Look for and test form elements
    const formInfo = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const forms = Array.from(document.querySelectorAll('form'));
      
      return {
        inputCount: inputs.length,
        inputTypes: [...new Set(inputs.map(input => input.type || input.tagName.toLowerCase()))],
        buttonCount: buttons.length,
        buttonTexts: buttons.map(btn => btn.textContent.trim()).filter(text => text && text.length < 50),
        formCount: forms.length
      };
    });
    
    console.log('📝 Form elements found:', JSON.stringify(formInfo, null, 2));
    
    this.results.findings.push({
      type: 'form-analysis',
      timestamp: new Date().toISOString(),
      formInfo
    });
    
    await this.takeScreenshot('06-form-analysis');
  }

  async generateReport() {
    console.log('\n📊 Generating Visual Test Report...');
    
    // Count findings by type
    const findingsSummary = this.results.findings.reduce((acc, finding) => {
      acc[finding.type] = (acc[finding.type] || 0) + 1;
      return acc;
    }, {});
    
    const report = {
      ...this.results,
      summary: {
        totalScreenshots: this.results.screenshots.length,
        totalFindings: this.results.findings.length,
        totalErrors: this.results.errors.length,
        findingsByType: findingsSummary,
        testCompleted: true
      }
    };
    
    // Save detailed report
    const reportPath = path.join(process.cwd(), 'visual-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 VISUAL VERIFICATION TEST REPORT');
    console.log('='.repeat(80));
    console.log(`📸 Screenshots taken: ${this.results.screenshots.length}`);
    console.log(`🔍 Findings recorded: ${this.results.findings.length}`);
    console.log(`❌ Console errors: ${this.results.errors.length}`);
    console.log('='.repeat(80));
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    console.log(`📁 Screenshots saved in: test-screenshots/visual-verification/`);
    
    return report;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.initialize();
      
      await this.testSidebarInteraction();
      await this.testMainContent();
      await this.testResponsiveDesign();
      await this.testFormInteractions();
      
      const report = await this.generateReport();
      return report;
      
    } catch (error) {
      console.error('❌ Visual test failed:', error.message);
      this.results.errors.push({
        type: 'test-failure',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      return this.results;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the visual test
if (require.main === module) {
  const visualTest = new VisualVerificationTest();
  visualTest.run().then(report => {
    process.exit(0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = VisualVerificationTest;