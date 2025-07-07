/**
 * SeaScape Backend Deployment Script
 * Executes all SQL scripts in sequence using Supabase client
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
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
    console.error('❌ Could not read .env file:', error.message)
    return {}
  }
}

const envVars = loadEnvFile()
const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY
const serviceRoleKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY

console.log('🚀 SeaScape Backend Deployment')
console.log('=' .repeat(50))

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

// Create clients
const supabase = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = serviceRoleKey && serviceRoleKey !== 'GET_FROM_SUPABASE_DASHBOARD' 
  ? createClient(supabaseUrl, serviceRoleKey) 
  : null

// SQL file paths (relative to project root)
const sqlFiles = [
  '../migration-unified-schema.sql',
  '../storage-bucket-setup.sql', 
  '../rls-policies-setup.sql',
  '../sample-bookings-data.sql'
]

async function executeSqlFile(filePath, description, useAdmin = false) {
  try {
    console.log(`\n📄 ${description}...`)
    
    const fullPath = path.join(__dirname, filePath)
    const sqlContent = fs.readFileSync(fullPath, 'utf8')
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`   Found ${statements.length} SQL statements`)
    
    const client = useAdmin && supabaseAdmin ? supabaseAdmin : supabase
    let successCount = 0
    let errors = []
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue
      }
      
      try {
        const { error } = await client.rpc('execute_sql', {
          sql_query: statement
        })
        
        if (error) {
          // Try direct SQL execution if RPC fails
          const { error: directError } = await client
            .from('_supabase_migrations')  // This will fail but test connection
            .select('*')
            .limit(0)
          
          if (directError && directError.message.includes('relation')) {
            // Connection is good, try alternative execution
            console.log(`   Statement ${i + 1}: Using alternative execution method`)
            // For schema statements, we need to use the service role
            if (useAdmin && supabaseAdmin) {
              console.log(`   Statement ${i + 1}: Requires manual execution (DDL statement)`)
              errors.push(`Statement ${i + 1}: ${statement.substring(0, 100)}... - Requires manual execution`)
            } else {
              console.log(`   Statement ${i + 1}: Requires service role key`)
              errors.push(`Statement ${i + 1}: ${statement.substring(0, 100)}... - Requires service role key`)
            }
          } else {
            errors.push(`Statement ${i + 1}: ${error.message}`)
            console.log(`   ❌ Statement ${i + 1} failed: ${error.message}`)
          }
        } else {
          successCount++
          console.log(`   ✅ Statement ${i + 1} executed successfully`)
        }
      } catch (execError) {
        errors.push(`Statement ${i + 1}: ${execError.message}`)
        console.log(`   ❌ Statement ${i + 1} failed: ${execError.message}`)
      }
    }
    
    if (errors.length === 0) {
      console.log(`   🎉 ${description} completed successfully!`)
      console.log(`   ✅ ${successCount} statements executed`)
      return true
    } else {
      console.log(`   ⚠️  ${description} completed with issues`)
      console.log(`   ✅ ${successCount} statements executed`)
      console.log(`   ❌ ${errors.length} statements failed`)
      
      if (errors.length < 10) {
        console.log('   Failed statements:')
        errors.forEach((error, index) => {
          console.log(`     ${index + 1}. ${error}`)
        })
      }
      
      return false
    }
    
  } catch (error) {
    console.error(`   ❌ Failed to execute ${description}:`, error.message)
    return false
  }
}

async function testConnection() {
  try {
    console.log('\n🔌 Testing connection...')
    
    const { data, error } = await supabase
      .from('non_existent_table')
      .select('*')
      .limit(1)
    
    if (error && (error.message.includes('relation') || error.code === 'PGRST106')) {
      console.log('✅ Connection successful')
      return true
    } else if (error) {
      console.log('❌ Connection failed:', error.message)
      return false
    }
    
    return true
  } catch (err) {
    console.log('❌ Connection test failed:', err.message)
    return false
  }
}

async function verifyDeployment() {
  try {
    console.log('\n🔍 Verifying deployment...')
    
    // Test bookings table
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)
    
    if (bookingsError) {
      if (bookingsError.message.includes('relation')) {
        console.log('❌ Bookings table not found - schema not deployed')
        return false
      } else {
        console.log('⚠️  Bookings table access issue:', bookingsError.message)
        return false
      }
    } else {
      console.log('✅ Bookings table accessible')
    }
    
    // Test sample data count
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log('⚠️  Cannot count bookings:', countError.message)
    } else {
      console.log(`✅ Found ${count} bookings in database`)
      if (count >= 10) {
        console.log('✅ Sample data appears to be loaded')
      } else if (count > 0) {
        console.log('⚠️  Some data found but less than expected')
      } else {
        console.log('⚠️  No sample data found')
      }
    }
    
    // Test storage bucket
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets()
    
    if (storageError) {
      console.log('⚠️  Cannot access storage:', storageError.message)
    } else {
      const crewBucket = buckets.find(b => b.id === 'crew-documents')
      if (crewBucket) {
        console.log('✅ Storage bucket configured')
      } else {
        console.log('⚠️  Storage bucket not found')
      }
    }
    
    return true
  } catch (error) {
    console.log('❌ Verification failed:', error.message)
    return false
  }
}

function printManualInstructions() {
  console.log('\n📝 Manual Deployment Required')
  console.log('=' .repeat(50))
  
  console.log('\n🎯 Supabase Dashboard Steps:')
  console.log('\n1. Open SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/kbwjtihjyhapaclyytxn/sql')
  
  console.log('\n2. Execute files in order:')
  console.log('   a. migration-unified-schema.sql (schema creation)')
  console.log('   b. storage-bucket-setup.sql (file storage)')
  console.log('   c. rls-policies-setup.sql (security policies)') 
  console.log('   d. sample-bookings-data.sql (test data)')
  
  console.log('\n3. Get Service Role Key:')
  console.log('   - Settings > API > service_role key')
  console.log('   - Update .env: VITE_SUPABASE_SERVICE_ROLE_KEY=your_key')
  
  console.log('\n4. Verify deployment:')
  console.log('   - Table Editor: Check bookings table exists')
  console.log('   - Storage: Check crew-documents bucket')
  console.log('   - Run: node verify-seascape-connection.cjs')
}

async function main() {
  try {
    const connected = await testConnection()
    
    if (!connected) {
      console.log('\n❌ Cannot connect to Supabase')
      console.log('   Check credentials and network connectivity')
      return
    }
    
    console.log('\n🗂️  Starting deployment sequence...')
    
    // Check if we have admin access
    if (!supabaseAdmin) {
      console.log('\n⚠️  Service role key not configured')
      console.log('   Some operations will require manual execution')
    }
    
    // Execute SQL files in sequence
    const results = []
    
    results.push(await executeSqlFile(
      sqlFiles[0], 
      'Executing schema migration', 
      true
    ))
    
    results.push(await executeSqlFile(
      sqlFiles[1], 
      'Setting up storage bucket', 
      true
    ))
    
    results.push(await executeSqlFile(
      sqlFiles[2], 
      'Configuring RLS policies', 
      true
    ))
    
    results.push(await executeSqlFile(
      sqlFiles[3], 
      'Inserting sample data', 
      false
    ))
    
    // Verify deployment
    await verifyDeployment()
    
    const successCount = results.filter(r => r === true).length
    const totalCount = results.length
    
    console.log('\n📊 Deployment Summary:')
    console.log(`   ✅ ${successCount}/${totalCount} scripts executed successfully`)
    
    if (successCount === totalCount) {
      console.log('\n🎉 Backend deployment completed!')
      console.log('✅ All SQL scripts executed successfully')
      console.log('✅ Database schema is ready')
      console.log('✅ Application can now connect to Supabase')
      
      console.log('\n🔄 Next Steps:')
      console.log('   1. Test frontend connection')
      console.log('   2. Run Puppeteer end-to-end tests')
      console.log('   3. Verify data flow from UI to database')
      
    } else {
      console.log('\n⚠️  Partial deployment completed')
      console.log('   Some scripts may require manual execution')
      printManualInstructions()
    }
    
  } catch (error) {
    console.error('\n❌ Deployment failed:', error)
    printManualInstructions()
  }
}

main()