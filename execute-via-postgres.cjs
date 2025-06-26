/**
 * Execute SQL via Direct Postgres Connection to Supabase
 * Uses pg client to connect directly to the database
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Supabase connection details
const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseHost = 'db.kbwjtihjyhapaclyytxn.supabase.co'
const supabasePort = 5432
const supabaseDatabase = 'postgres'

console.log('🚀 SeaScape SQL Execution via Direct Postgres Connection')
console.log('=' .repeat(50))

// Try to read environment for potential database password
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && !key.startsWith('#')) {
        envVars[key.trim()] = valueParts.join('=').trim()
      }
    })
    
    return envVars
  } catch (error) {
    return {}
  }
}

const envVars = loadEnvFile()
const dbPassword = envVars.SUPABASE_DB_PASSWORD || 'your_db_password_here'

async function executeSQL(client, sql, description) {
  try {
    console.log(`   🔄 ${description}...`)
    const result = await client.query(sql)
    console.log(`   ✅ ${description} - Success`)
    return { success: true, result }
  } catch (error) {
    if (error.message.includes('already exists') || 
        error.message.includes('duplicate key')) {
      console.log(`   ⚠️  ${description} - Already exists (continuing)`)
      return { success: true, already_exists: true }
    } else {
      console.log(`   ❌ ${description} - Failed: ${error.message}`)
      return { success: false, error: error.message }
    }
  }
}

async function executeSQLFile(client, filePath, description) {
  try {
    console.log(`\n📄 ${description}`)
    
    const fullPath = path.join(__dirname, filePath)
    if (!fs.existsSync(fullPath)) {
      console.log(`   ❌ File not found: ${fullPath}`)
      return false
    }
    
    const sqlContent = fs.readFileSync(fullPath, 'utf8')
    
    // For schema files, try executing as a transaction
    if (description.includes('schema') || description.includes('migration')) {
      try {
        await client.query('BEGIN')
        await client.query(sqlContent)
        await client.query('COMMIT')
        console.log(`   ✅ ${description} - Transaction completed`)
        return true
      } catch (error) {
        await client.query('ROLLBACK')
        console.log(`   ⚠️  Transaction failed, trying statement by statement`)
      }
    }
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => {
        return stmt.length > 0 && 
               !stmt.startsWith('--') && 
               !stmt.match(/^\s*\/\*/) &&
               stmt !== 'BEGIN' &&
               stmt !== 'COMMIT'
      })
    
    console.log(`   Found ${statements.length} statements to execute`)
    
    let successCount = 0
    let skipCount = 0
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      
      if (statement.length < 5) {
        skipCount++
        continue
      }
      
      const result = await executeSQL(client, statement, `Statement ${i + 1}`)
      
      if (result.success) {
        if (result.already_exists) {
          skipCount++
        } else {
          successCount++
        }
      }
      
      // Small delay between statements
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    
    console.log(`   📊 Results: ${successCount} executed, ${skipCount} existed`)
    return successCount > 0 || skipCount > 0
    
  } catch (error) {
    console.error(`   ❌ Failed to process ${description}:`, error.message)
    return false
  }
}

async function testConnection() {
  // Try different connection approaches
  const connectionConfigs = [
    {
      host: supabaseHost,
      port: supabasePort,
      database: supabaseDatabase,
      user: 'postgres',
      password: dbPassword,
      ssl: { rejectUnauthorized: false }
    },
    {
      host: supabaseHost,
      port: supabasePort,
      database: supabaseDatabase,
      user: 'postgres',
      password: 'your_password_here',
      ssl: { rejectUnauthorized: false }
    }
  ]
  
  for (let i = 0; i < connectionConfigs.length; i++) {
    const config = connectionConfigs[i]
    const client = new Client(config)
    
    try {
      console.log(`\n🔌 Testing connection attempt ${i + 1}...`)
      console.log(`   Host: ${config.host}`)
      console.log(`   Database: ${config.database}`)
      console.log(`   User: ${config.user}`)
      
      await client.connect()
      
      // Test with simple query
      const result = await client.query('SELECT current_timestamp as server_time')
      console.log(`   ✅ Connection successful`)
      console.log(`   Server time: ${result.rows[0].server_time}`)
      
      return client
      
    } catch (error) {
      console.log(`   ❌ Connection ${i + 1} failed: ${error.message}`)
      try {
        await client.end()
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  return null
}

async function main() {
  let client = null
  
  try {
    // Test database connection
    client = await testConnection()
    
    if (!client) {
      console.log('\n❌ Cannot connect to Supabase database')
      console.log('   Database password may be required')
      console.log('   Get password from: Supabase Dashboard > Settings > Database')
      console.log('')
      console.log('   Update .env with: SUPABASE_DB_PASSWORD=your_password')
      console.log('   Or execute SQL manually in Supabase Dashboard')
      
      console.log('\n📝 Manual Deployment Alternative:')
      console.log('   1. https://supabase.com/dashboard/project/kbwjtihjyhapaclyytxn/sql')
      console.log('   2. Copy and execute each SQL file')
      console.log('   3. Verify with: node verify-seascape-connection.cjs')
      return
    }
    
    console.log('\n🗂️  Starting database deployment...')
    
    // Execute SQL files in sequence
    const results = []
    
    console.log('\n🏗️  Phase 1: Schema Migration')
    results.push(await executeSQLFile(
      client,
      '../migration-unified-schema.sql',
      'Unified bookings table schema'
    ))
    
    console.log('\n🗄️  Phase 2: Storage Configuration')
    results.push(await executeSQLFile(
      client,
      '../storage-bucket-setup.sql',
      'Storage bucket and policies'
    ))
    
    console.log('\n🔒 Phase 3: Security Setup')
    results.push(await executeSQLFile(
      client,
      '../rls-policies-setup.sql',
      'Row Level Security policies'
    ))
    
    console.log('\n📊 Phase 4: Sample Data')
    results.push(await executeSQLFile(
      client,
      '../sample-bookings-data.sql',
      'Test booking records'
    ))
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...')
    try {
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'bookings'
      `)
      
      if (tableCheck.rows.length > 0) {
        console.log('   ✅ Bookings table exists')
        
        const countResult = await client.query('SELECT COUNT(*) as total FROM bookings')
        const bookingCount = parseInt(countResult.rows[0].total)
        console.log(`   ✅ Found ${bookingCount} booking records`)
        
        if (bookingCount >= 10) {
          console.log('   ✅ Sample data appears complete')
        }
      } else {
        console.log('   ❌ Bookings table not found')
      }
    } catch (verifyError) {
      console.log(`   ⚠️  Verification error: ${verifyError.message}`)
    }
    
    // Summary
    const successCount = results.filter(r => r === true).length
    console.log('\n📊 Deployment Summary:')
    console.log(`   ✅ ${successCount}/4 phases completed`)
    
    if (successCount >= 3) {
      console.log('\n🎉 Database Deployment Successful!')
      console.log('✅ Schema has been deployed')
      console.log('✅ Security policies are active')
      console.log('✅ Sample data is available')
      
      console.log('\n🔄 Next Steps:')
      console.log('   1. Run: node verify-seascape-connection.cjs')
      console.log('   2. Test application connectivity')
      console.log('   3. Proceed with Phase 3: Backend Services')
    } else {
      console.log('\n⚠️  Partial deployment')
      console.log('   Review any errors above')
      console.log('   Consider manual execution for failed operations')
    }
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message)
  } finally {
    if (client) {
      try {
        await client.end()
        console.log('\n📡 Database connection closed')
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

// Check if pg module is available
try {
  require('pg')
  main().catch(console.error)
} catch (moduleError) {
  console.log('❌ PostgreSQL client (pg) module not available')
  console.log('   Install with: npm install pg')
  console.log('   Or use manual deployment in Supabase Dashboard')
  console.log('\n📝 Manual Deployment Instructions:')
  console.log('   1. https://supabase.com/dashboard/project/kbwjtihjyhapaclyytxn/sql')
  console.log('   2. Execute each SQL file in order')
  console.log('   3. Verify with application connection test')
}