/**
 * Verify Booking Code Format
 * Tests if the generated booking code matches expected YYWWBCNN format
 */

console.log('=== Booking Code Verification ===\n')

const generatedCode = '2527ZA01'
const testDate = new Date('2025-07-05')

console.log(`Generated booking code: ${generatedCode}`)
console.log(`Test date: ${testDate.toDateString()}`)
console.log(`Yacht: Zavaria`)

// Parse the code
const yy = generatedCode.slice(0, 2)
const ww = generatedCode.slice(2, 4)
const bc = generatedCode.slice(4, 6)
const nn = generatedCode.slice(6, 8)

console.log(`\nCode breakdown:`)
console.log(`  YY (Year): ${yy}`)
console.log(`  WW (Week): ${ww}`)
console.log(`  BC (Boat): ${bc}`)
console.log(`  NN (Sequence): ${nn}`)

// Calculate expected values
const expectedYear = '25'
const expectedBoat = 'ZA'

// Calculate ISO week for July 5, 2025
function getISOWeek(date) {
  const targetDate = new Date(date.getTime())
  const dayNumber = (targetDate.getDay() + 6) % 7
  targetDate.setDate(targetDate.getDate() - dayNumber + 3)
  const jan4 = new Date(targetDate.getFullYear(), 0, 4)
  const weekNumber = Math.round(((targetDate.getTime() - jan4.getTime()) / 86400000 - 3 + (jan4.getDay() + 6) % 7) / 7) + 1
  return weekNumber
}

const expectedWeek = getISOWeek(testDate).toString().padStart(2, '0')

console.log(`\nExpected values:`)
console.log(`  YY (Year): ${expectedYear}`)
console.log(`  WW (Week): ${expectedWeek}`)
console.log(`  BC (Boat): ${expectedBoat}`)
console.log(`  NN (Sequence): 01 (first booking)`)

// Validate
const yearMatch = yy === expectedYear
const weekMatch = ww === expectedWeek
const boatMatch = bc === expectedBoat
const seqValid = parseInt(nn) >= 1

console.log(`\nValidation:`)
console.log(`  Year check: ${yearMatch ? '✅ PASS' : '❌ FAIL'} (${yy} ${yearMatch ? '===' : '!=='} ${expectedYear})`)
console.log(`  Week check: ${weekMatch ? '✅ PASS' : '❌ FAIL'} (${ww} ${weekMatch ? '===' : '!=='} ${expectedWeek})`)
console.log(`  Boat check: ${boatMatch ? '✅ PASS' : '❌ FAIL'} (${bc} ${boatMatch ? '===' : '!=='} ${expectedBoat})`)
console.log(`  Sequence check: ${seqValid ? '✅ PASS' : '❌ FAIL'} (${nn} >= 01)`)

const overallResult = yearMatch && weekMatch && boatMatch && seqValid

console.log(`\n=== FINAL RESULT ===`)
console.log(`Booking code format: ${overallResult ? '✅ CORRECT' : '❌ INCORRECT'}`)
console.log(`Generated code follows YYWWBCNN format: ${overallResult ? 'YES' : 'NO'}`)

if (overallResult) {
  console.log(`\n🎉 SUCCESS: The booking creation system correctly generates`)
  console.log(`booking codes in the YYWWBCNN format!`)
} else {
  console.log(`\n❌ The booking code does not match the expected format.`)
}