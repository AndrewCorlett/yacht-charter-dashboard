/**
 * Test script to diagnose server connectivity issues
 */

const testUrls = [
  'http://localhost:3005/',
  'http://127.0.0.1:3005/',
  'http://172.28.90.86:3005/',
  'http://10.255.255.254:3005/'
]

async function testServerAccess() {
  console.log('🔄 Testing server accessibility...\n')

  for (const url of testUrls) {
    try {
      console.log(`Testing: ${url}`)
      
      const response = await fetch(url, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (response.ok) {
        console.log(`✅ ${url} - Server accessible (${response.status})`)
      } else {
        console.log(`⚠️ ${url} - Server responded but with status ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ ${url} - Connection failed: ${error.message}`)
    }
    console.log('')
  }

  console.log('🏁 Server accessibility test completed')
}

testServerAccess().catch(console.error)