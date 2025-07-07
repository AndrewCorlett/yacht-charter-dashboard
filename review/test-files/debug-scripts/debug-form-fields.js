/**
 * Debug form fields to see actual field names
 */

import puppeteer from 'puppeteer'

async function debugFormFields() {
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' })
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Get all form field names and types
    const formFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
      return inputs.map(input => ({
        tag: input.tagName.toLowerCase(),
        type: input.type || input.tagName.toLowerCase(),
        name: input.name,
        placeholder: input.placeholder,
        id: input.id,
        required: input.required,
        value: input.value
      }))
    })
    
    console.log('Form fields found:')
    formFields.forEach((field, index) => {
      console.log(`${index + 1}. ${field.tag}[${field.type}]`)
      console.log(`   name: "${field.name}"`)
      console.log(`   placeholder: "${field.placeholder}"`)
      console.log(`   id: "${field.id}"`)
      console.log(`   required: ${field.required}`)
      console.log(`   value: "${field.value}"`)
      console.log('')
    })
    
    // Also check labels to understand what each field is for
    const labels = await page.evaluate(() => {
      const labelElements = Array.from(document.querySelectorAll('label'))
      return labelElements.map(label => ({
        text: label.textContent.trim(),
        for: label.getAttribute('for'),
        html: label.innerHTML
      }))
    })
    
    console.log('Labels found:')
    labels.forEach((label, index) => {
      console.log(`${index + 1}. "${label.text}" (for: ${label.for})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

debugFormFields()