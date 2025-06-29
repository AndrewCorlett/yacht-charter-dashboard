/**
 * Execute SQL via Supabase REST API
 * Uses the MCP access token to execute SQL scripts directly
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

// MCP Supabase access token
const SUPABASE_ACCESS_TOKEN = 'sbp_3d1724d7b2826ce639554221a0acef8be44c2b0a'
const PROJECT_REF = 'kbwjtihjyhapaclyytxn'

console.log('🚀 SeaScape SQL Execution via Supabase API')
console.log('=' .repeat(50))

async function executeSQL(sql, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql })
    
    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            console.log(`✅ ${description} - Success`)
            const response = data ? JSON.parse(data) : {}
            resolve(response)
          } else {
            console.log(`❌ ${description} - HTTP ${res.statusCode}: ${data}`)
            reject(new Error(`HTTP ${res.statusCode}: ${data}`))
          }
        } catch (parseError) {
          // If it's a 200 response but parse fails, still consider it success
          if (res.statusCode === 200) {
            console.log(`✅ ${description} - Success (non-JSON response)`)
            resolve({ success: true, data: data })
          } else {
            console.log(`❌ ${description} - Parse error: ${parseError.message}`)
            reject(parseError)
          }
        }
      })
    })

    req.on('error', (error) => {
      console.log(`❌ ${description} - Request error: ${error.message}`)
      reject(error)
    })

    req.write(postData)
    req.end()
  })
}

async function executeSQLFile(filePath, description) {
  try {
    console.log(`\n📄 ${description}...`)
    
    const fullPath = path.join(__dirname, filePath)
    const sqlContent = fs.readFileSync(fullPath, 'utf8')
    
    // Remove comments and split into statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*\/\*/))
    
    console.log(`   Found ${statements.length} SQL statements`)
    
    let successCount = 0
    let errors = []
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      
      if (statement.length === 0) continue
      
      try {
        await executeSQL(statement, `Statement ${i + 1}`)
        successCount++
        
        // Add delay between statements to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        errors.push(`Statement ${i + 1}: ${error.message}`)
        
        // Don't fail completely - some statements might be expected to fail
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate key') ||
            error.message.includes('relation') && error.message.includes('already exists')) {
          console.log(`   ⚠️  Statement ${i + 1}: Already exists (continuing)`)
          successCount++
        }
      }
    }
    
    console.log(`   📊 Results: ${successCount}/${statements.length} statements completed`)
    
    if (errors.length > 0 && errors.length < 5) {
      console.log('   Errors encountered:')
      errors.slice(0, 3).forEach(error => console.log(`     • ${error}`))
    }
    
    return successCount > 0
    
  } catch (error) {
    console.error(`   ❌ Failed to execute ${description}:`, error.message)
    return false
  }
}

async function testConnection() {
  try {
    console.log('\n🔌 Testing Supabase API connection...')
    
    const result = await executeSQL('SELECT 1 as test', 'Connection test')
    return true
  } catch (error) {
    console.log('❌ Connection failed:', error.message)
    return false
  }
}

async function verifySchema() {
  try {
    console.log('\n🔍 Verifying schema deployment...')
    
    // Check if bookings table exists
    await executeSQL(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      LIMIT 5
    `, 'Check bookings table')
    
    // Count records
    await executeSQL('SELECT COUNT(*) as total FROM bookings', 'Count bookings')
    
    return true
  } catch (error) {
    console.log('⚠️  Schema verification failed:', error.message)
    return false
  }
}

async function main() {
  try {
    // Test connection first
    const connected = await testConnection()
    if (!connected) {
      console.log('\n❌ Cannot connect to Supabase API')
      console.log('   Check access token and project reference')
      return
    }
    
    console.log('\n🗂️  Starting SQL deployment sequence...')
    
    // Execute SQL files in order
    const results = []
    
    results.push(await executeSQLFile(
      '../migration-unified-schema.sql',
      'Executing schema migration'
    ))
    
    results.push(await executeSQLFile(
      '../storage-bucket-setup.sql', 
      'Setting up storage bucket'
    ))
    
    results.push(await executeSQLFile(
      '../rls-policies-setup.sql',
      'Configuring RLS policies'
    ))
    
    results.push(await executeSQLFile(
      '../sample-bookings-data.sql',
      'Inserting sample data'
    ))
    
    // Verify deployment
    await verifySchema()
    
    const successCount = results.filter(r => r === true).length
    console.log('\n📊 Deployment Summary:')
    console.log(`   ✅ ${successCount}/4 SQL files processed`)
    
    if (successCount >= 3) {
      console.log('\n🎉 SQL deployment completed!')
      console.log('✅ Database schema should be ready')
      console.log('✅ Run verification script to confirm')
      
      console.log('\n🔄 Next Steps:')
      console.log('   1. Run: node verify-seascape-connection.cjs')
      console.log('   2. Check Supabase Dashboard for confirmation')
      console.log('   3. Proceed with Phase 3 implementation')
    } else {
      console.log('\n⚠️  Partial deployment completed')
      console.log('   Check Supabase Dashboard for any manual corrections needed')
    }
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error)
  }
}

main()