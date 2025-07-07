// This script is designed to be run with the MCP Puppeteer server
// It tests the booking number editing functionality

const testSteps = `
1. Navigate to http://localhost:5173
2. Go to the Booking Management section
3. Create a new booking with:
   - Yacht: Disk Drive
   - Charter Type: Bareboat
   - Start Date: 2025-01-15
   - End Date: 2025-01-22
   - Customer: Test Customer
   - Email: test@example.com
4. Save the booking
5. Note the booking number
6. Click on the booking to view details
7. Find and click the edit icon next to the booking number
8. Change the last two digits (NN) by adding 5
9. Save the change
10. Refresh the page
11. Verify if the booking number persisted

Expected format: YYWWDDNN where NN is the sequence number
`;

console.log("Test Steps for MCP Puppeteer:");
console.log(testSteps);
console.log("\nPlease run these steps using the MCP Puppeteer server.");