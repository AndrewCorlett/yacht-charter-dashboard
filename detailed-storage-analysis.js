#!/usr/bin/env node

/**
 * Detailed Storage Analysis
 * 
 * This script examines the storage bucket structure more deeply
 * to understand the exact file paths and folder structure
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kbwjtihjyhapaclyytxn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtid2p0aWhqeWhhcGFjbHl5dHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MzIxMjksImV4cCI6MjA2NjUwODEyOX0.i6vbPAhTkfwInLnvfmNDblUNdEF4Y-r0jzXMiKUZtqI'
const bucketName = 'form-templates'

console.log('🔍 Detailed Storage Structure Analysis')
console.log('=====================================')

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Recursively explore storage structure
 */
async function exploreFolder(path = '', depth = 0) {
  const indent = '  '.repeat(depth)
  console.log(`${indent}📁 Exploring: "${path}"`)
  
  try {
    const { data: items, error } = await supabase.storage
      .from(bucketName)
      .list(path, {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error(`${indent}❌ Error exploring ${path}:`, error)
      return
    }

    if (!items || items.length === 0) {
      console.log(`${indent}📂 Empty folder`)
      return
    }

    for (const item of items) {
      const fullPath = path ? `${path}/${item.name}` : item.name
      
      if (item.id === null) {
        // This is a folder
        console.log(`${indent}📁 FOLDER: ${item.name}`)
        await exploreFolder(fullPath, depth + 1)
      } else {
        // This is a file
        console.log(`${indent}📄 FILE: ${item.name}`)
        console.log(`${indent}   🔗 Full Path: ${fullPath}`)
        console.log(`${indent}   📏 Size: ${item.metadata?.size || 'unknown'} bytes`)
        console.log(`${indent}   🗂️  MIME: ${item.metadata?.mimetype || 'unknown'}`)
        console.log(`${indent}   📅 Created: ${item.created_at || 'unknown'}`)
        console.log(`${indent}   📅 Updated: ${item.updated_at || 'unknown'}`)
        console.log(`${indent}   🆔 ID: ${item.id || 'unknown'}`)
        
        // Try to get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fullPath)
        console.log(`${indent}   🔗 Public URL: ${publicUrl}`)
        
        // Test download of this specific file
        await testFileDownload(fullPath, depth + 1)
        console.log()
      }
    }
  } catch (error) {
    console.error(`${indent}💥 Failed to explore ${path}:`, error)
  }
}

/**
 * Test downloading a specific file
 */
async function testFileDownload(filePath, depth = 0) {
  const indent = '  '.repeat(depth)
  
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath)

    if (error) {
      console.log(`${indent}   ❌ Download test failed: ${error.message}`)
    } else {
      console.log(`${indent}   ✅ Download test successful (${data.size} bytes, ${data.type})`)
    }
  } catch (error) {
    console.log(`${indent}   💥 Download test error: ${error.message}`)
  }
}

/**
 * Check if files might be folders (directories)
 */
async function investigateItems() {
  console.log('\n🕵️ Investigating Suspected Folders:')
  console.log('===================================')
  
  const suspectedFolders = ['initialTerms', 'depositInvoice', 'contract', 'balanceInvoice']
  
  for (const folder of suspectedFolders) {
    console.log(`\n📁 Checking "${folder}":`)
    
    // Try to list contents as if it's a folder
    try {
      const { data: contents, error } = await supabase.storage
        .from(bucketName)
        .list(folder, { limit: 10 })

      if (error) {
        console.log(`   ❌ Not a folder: ${error.message}`)
      } else if (contents && contents.length > 0) {
        console.log(`   ✅ This IS a folder with ${contents.length} items:`)
        contents.forEach((item, i) => {
          console.log(`      ${i + 1}. ${item.name} (${item.id ? 'file' : 'folder'})`)
        })
      } else {
        console.log(`   📂 This is an empty folder`)
      }
    } catch (error) {
      console.log(`   💥 Error checking folder: ${error.message}`)
    }
  }
}

/**
 * Main analysis function
 */
async function main() {
  try {
    // Start exploration from root
    await exploreFolder('', 0)
    
    // Investigate suspected folders
    await investigateItems()
    
    console.log('\n🔎 Analysis Complete!')
    console.log('====================')
    
  } catch (error) {
    console.error('💥 Analysis failed:', error)
  }
}

main()