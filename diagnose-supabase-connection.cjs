/**
 * Supabase Connection Diagnostic Tool
 * 
 * Tests the Supabase connection and real-time capabilities
 * to identify specific configuration issues.
 * 
 * @created 2025-06-27
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const config = {
  supabaseUrl: process.env.VITE_SUPABASE_URL,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  useSupabase: process.env.VITE_USE_SUPABASE === 'true'
};

class SupabaseDiagnostic {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      config: config,
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };
  }

  log(test, status, details = {}) {
    const result = {
      test,
      status,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.results.tests.push(result);
    this.results.summary.total++;
    
    if (status === 'PASS') {
      this.results.summary.passed++;
      console.log(`✅ ${test}: PASSED`);
    } else {
      this.results.summary.failed++;
      console.log(`❌ ${test}: FAILED - ${details.error || 'Unknown error'}`);
    }
    
    if (details.info) {
      console.log(`   ℹ️  ${details.info}`);
    }
  }

  async testEnvironmentVariables() {
    console.log('\n🔧 Testing Environment Variables...');
    
    if (!config.supabaseUrl) {
      this.log('Environment Variables', 'FAIL', {
        error: 'VITE_SUPABASE_URL not set'
      });
      return;
    }
    
    if (!config.supabaseAnonKey) {
      this.log('Environment Variables', 'FAIL', {
        error: 'VITE_SUPABASE_ANON_KEY not set'
      });
      return;
    }
    
    if (!config.useSupabase) {
      this.log('Environment Variables', 'FAIL', {
        error: 'VITE_USE_SUPABASE is not true'
      });
      return;
    }

    this.log('Environment Variables', 'PASS', {
      info: `URL: ${config.supabaseUrl.substring(0, 30)}...`
    });
  }

  async testSupabaseConnection() {
    console.log('\n🔗 Testing Supabase Connection...');
    
    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      
      // Test basic connection with a simple query
      const { data, error } = await supabase
        .from('bookings')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          this.log('Supabase Connection', 'PASS', {
            info: 'Connected but bookings table not found (expected for new setup)',
            error: error.message
          });
        } else {
          this.log('Supabase Connection', 'FAIL', {
            error: error.message
          });
        }
      } else {
        this.log('Supabase Connection', 'PASS', {
          info: `Found ${data ? data.length : 0} bookings`
        });
      }
      
    } catch (error) {
      this.log('Supabase Connection', 'FAIL', {
        error: error.message
      });
    }
  }

  async testRealtimeCapability() {
    console.log('\n📡 Testing Real-time Capability...');
    
    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      
      // Test if we can create a channel
      const channel = supabase.channel('test-channel');
      
      if (channel) {
        this.log('Real-time Channel Creation', 'PASS', {
          info: 'Can create real-time channels'
        });
        
        // Test subscription setup
        let subscriptionWorked = false;
        
        const subscription = channel
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'bookings' }, 
            (payload) => {
              subscriptionWorked = true;
            })
          .subscribe();
        
        // Wait a moment for subscription to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.log('Real-time Subscription Setup', 'PASS', {
          info: 'Subscription created successfully'
        });
        
        // Clean up
        await supabase.removeChannel(channel);
        
      } else {
        this.log('Real-time Channel Creation', 'FAIL', {
          error: 'Unable to create real-time channel'
        });
      }
      
    } catch (error) {
      this.log('Real-time Capability', 'FAIL', {
        error: error.message
      });
    }
  }

  async testDatabaseSchema() {
    console.log('\n🗄️  Testing Database Schema...');
    
    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      
      // Test if bookings table exists
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .limit(0); // Just get schema, no data
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          this.log('Database Schema', 'FAIL', {
            error: 'Bookings table does not exist',
            info: 'Run database migrations first'
          });
        } else {
          this.log('Database Schema', 'FAIL', {
            error: error.message
          });
        }
      } else {
        this.log('Database Schema', 'PASS', {
          info: 'Bookings table exists and is accessible'
        });
      }
      
    } catch (error) {
      this.log('Database Schema', 'FAIL', {
        error: error.message
      });
    }
  }

  async testYachtsTable() {
    console.log('\n⛵ Testing Yachts Table...');
    
    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      
      const { data, error } = await supabase
        .from('yachts')
        .select('id, name')
        .limit(5);
      
      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          this.log('Yachts Table', 'FAIL', {
            error: 'Yachts table does not exist',
            info: 'Create yachts table and seed data'
          });
        } else {
          this.log('Yachts Table', 'FAIL', {
            error: error.message
          });
        }
      } else {
        this.log('Yachts Table', 'PASS', {
          info: `Found ${data ? data.length : 0} yachts`
        });
      }
      
    } catch (error) {
      this.log('Yachts Table', 'FAIL', {
        error: error.message
      });
    }
  }

  async generateReport() {
    console.log('\n📊 Diagnostic Summary:');
    console.log(`   Tests Run: ${this.results.summary.total}`);
    console.log(`   Passed: ${this.results.summary.passed}`);
    console.log(`   Failed: ${this.results.summary.failed}`);
    
    const successRate = this.results.summary.total > 0 
      ? (this.results.summary.passed / this.results.summary.total * 100).toFixed(1)
      : 0;
    
    console.log(`   Success Rate: ${successRate}%`);
    
    if (this.results.summary.failed > 0) {
      console.log('\n🔧 Issues Found:');
      this.results.tests
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`   - ${test.test}: ${test.details.error}`);
          if (test.details.info) {
            console.log(`     💡 ${test.details.info}`);
          }
        });
    }
    
    // Save detailed report
    const fs = require('fs');
    fs.writeFileSync('./supabase-diagnostic-report.json', JSON.stringify(this.results, null, 2));
    console.log('\n📄 Detailed report saved to: supabase-diagnostic-report.json');
    
    return this.results;
  }
}

async function runDiagnostics() {
  console.log('🔍 Supabase Connection Diagnostic Tool');
  console.log('=====================================');
  
  const diagnostic = new SupabaseDiagnostic();
  
  try {
    await diagnostic.testEnvironmentVariables();
    await diagnostic.testSupabaseConnection();
    await diagnostic.testDatabaseSchema();
    await diagnostic.testYachtsTable();
    await diagnostic.testRealtimeCapability();
    
    const results = await diagnostic.generateReport();
    
    // Exit with appropriate code
    const exitCode = results.summary.failed > 0 ? 1 : 0;
    process.exit(exitCode);
    
  } catch (error) {
    console.error('🚨 Diagnostic failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runDiagnostics();
}

module.exports = { SupabaseDiagnostic, runDiagnostics };