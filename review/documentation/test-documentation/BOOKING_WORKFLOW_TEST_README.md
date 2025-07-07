# Comprehensive Booking Workflow Test Suite

This test suite validates the complete booking creation workflow using Puppeteer MCP to ensure that:

1. ✅ Quick Create booking form is accessible and functional
2. ✅ All form fields can be filled with realistic test data
3. ✅ Yacht selection from dropdown works correctly
4. ✅ Booking submission completes successfully
5. ✅ Booking codes are generated in YYWWBCNN format (not BK format)
6. ✅ booking_confirmed is set to true
7. ✅ Sequential numbering works for multiple bookings on same yacht
8. ✅ UUID mapping fix is working correctly

## Test Files

- `test-comprehensive-booking-workflow.js` - Main test implementation
- `run-booking-workflow-test.js` - Test execution script
- `BOOKING_WORKFLOW_TEST_README.md` - This documentation

## Prerequisites

1. **Development Server Running**
   ```bash
   npm run dev
   ```
   The application should be accessible at `http://localhost:5173`

2. **Puppeteer Installed**
   ```bash
   npm install puppeteer
   ```

3. **Database Connection**
   - Ensure Supabase is configured and accessible
   - Verify that the `yachts` table has test data
   - Confirm `bookings` table is properly set up

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Run the test:**
   ```bash
   node run-booking-workflow-test.js
   ```

3. **View results:**
   - Screenshots will be saved in `./test-screenshots/comprehensive-booking-workflow/`
   - Test report will be saved as `test-report.json`
   - Console output provides real-time test progress

## Test Configuration

The test uses realistic Scottish yacht charter data:

### Test Data Profile 1
- **Customer:** John MacLeod
- **Email:** john.macleod@example.com
- **Phone:** +44 1475 123456
- **Address:** 123 Marina Drive, Largs, KA30 8BG
- **Charter:** 2025-07-20 to 2025-07-27
- **Yacht:** Zavaria (ZA)

### Test Data Profile 2
- **Customer:** Sarah Robertson
- **Email:** sarah.robertson@example.com
- **Phone:** +44 1475 987654
- **Address:** 456 Harbour Way, Millport, KA28 0EA
- **Charter:** 2025-08-10 to 2025-08-17
- **Yacht:** Zavaria (ZA)

## Test Validations

### 1. Booking Code Format (YYWWBCNN)
- **Format:** Year-Week-YachtCode-Sequence
- **Example:** `2529ZA01` (2025, Week 29, Zavaria, Booking #01)
- **Validation:** Rejects old BK format (e.g., BK001)

### 2. Sequential Numbering
- First booking: `2529ZA01`
- Second booking: `2529ZA02`
- Verifies proper sequence increment

### 3. Database Persistence
- Confirms booking appears in database
- Validates booking_confirmed = true
- Checks all required fields are saved

### 4. UUID Mapping
- Verifies yacht selection by UUID works
- Confirms yacht name is properly mapped
- Validates booking number generation uses correct yacht code

## Expected Output

### Success Scenario
```
[2025-07-05T10:30:00.000Z] [INFO] Starting comprehensive booking workflow test
[2025-07-05T10:30:05.000Z] [INFO] Navigating to application...
[2025-07-05T10:30:10.000Z] [INFO] === TEST 1: Creating first booking ===
[2025-07-05T10:30:15.000Z] [INFO] Filled First Name: John
[2025-07-05T10:30:16.000Z] [INFO] Filled Surname: MacLeod
[2025-07-05T10:30:17.000Z] [INFO] Selected yacht: Zavaria (uuid-abc-123)
[2025-07-05T10:30:25.000Z] [INFO] Booking created successfully: 2529ZA01
[2025-07-05T10:30:26.000Z] [INFO] Format check: YYWWBCNN
[2025-07-05T10:30:27.000Z] [INFO] Database check: true
[2025-07-05T10:30:30.000Z] [INFO] === TEST 2: Creating second booking ===
[2025-07-05T10:30:45.000Z] [INFO] Booking created successfully: 2529ZA02
[2025-07-05T10:30:46.000Z] [INFO] Sequential numbering check: PASSED
[2025-07-05T10:30:47.000Z] [INFO] Comprehensive booking workflow test PASSED
```

### Test Report Structure
```json
{
  "testSuite": "Comprehensive Booking Workflow Test",
  "timestamp": "2025-07-05T10:30:47.000Z",
  "duration": 47000,
  "success": true,
  "summary": {
    "totalBookings": 2,
    "successfulBookings": 2,
    "failedBookings": 0,
    "screenshotsTaken": 6,
    "errorsEncountered": 0
  },
  "bookings": [
    {
      "bookingNumber": "2529ZA01",
      "customerName": "John MacLeod",
      "yachtName": "Zavaria",
      "formatCheck": {
        "isValid": true,
        "format": "YYWWBCNN"
      },
      "dbCheck": true,
      "success": true
    }
  ],
  "validations": {
    "bookingCodeFormat": [...],
    "databasePersistence": [...]
  }
}
```

## Troubleshooting

### Common Issues

1. **Development Server Not Running**
   ```
   Error: Development server is not running
   Solution: Start with `npm run dev`
   ```

2. **Yacht Dropdown Empty**
   ```
   Error: No yacht available for selection
   Solution: Check yachts table has data, verify Supabase connection
   ```

3. **Booking Number Not Generated**
   ```
   Error: Could not extract booking number
   Solution: Check BookingNumberGenerator, verify database triggers
   ```

4. **Form Fields Not Found**
   ```
   Error: Element not found
   Solution: Update selectors in test, check component structure
   ```

### Debug Mode

To run with additional debugging:

```bash
# Enable debug screenshots
TEST_DEBUG=true node run-booking-workflow-test.js

# Run with browser visible (non-headless)
TEST_HEADLESS=false node run-booking-workflow-test.js
```

## Screenshots

The test captures screenshots at key moments:

1. `01-initial-load.png` - Application startup
2. `booking-john-01-form-ready.png` - Form ready for first booking
3. `booking-john-02-form-filled.png` - Form filled with data
4. `booking-john-03-success.png` - First booking success
5. `booking-sarah-01-form-ready.png` - Form ready for second booking
6. `booking-sarah-02-form-filled.png` - Second form filled
7. `booking-sarah-03-success.png` - Second booking success
8. `99-error-state.png` - Error state (if any)

## Integration with CI/CD

To integrate with automated testing:

```bash
# Add to package.json scripts
"test:booking-workflow": "node run-booking-workflow-test.js",
"test:e2e-full": "npm run test:booking-workflow"
```

## Customization

### Adding New Test Cases

1. **Modify test data** in `TEST_CONFIG.testData`
2. **Add new yacht selections** in yacht selection logic
3. **Extend validations** in validation functions
4. **Add new screenshots** in appropriate test phases

### Changing Test Configuration

```javascript
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5173',  // Application URL
  timeouts: {
    pageLoad: 30000,                 // Page load timeout
    formSubmission: 15000,           // Form submission timeout
    yachtSelection: 10000,           // Yacht selection timeout
    modalAppear: 5000,               // Success modal timeout
    databaseCheck: 10000             // Database verification timeout
  },
  screenshots: {
    enabled: true,                   // Enable/disable screenshots
    path: './test-screenshots/',    // Screenshot save path
    quality: 90                      // Screenshot quality
  }
}
```

## Contributing

When contributing to this test suite:

1. **Follow existing patterns** for consistency
2. **Add proper error handling** for all new functionality
3. **Include comprehensive logging** for debugging
4. **Update documentation** when adding new features
5. **Test thoroughly** before submitting changes

## Support

For issues or questions:

1. Check console output for detailed error messages
2. Review screenshots for visual debugging
3. Examine test-report.json for comprehensive results
4. Verify database state manually if needed

---

**Note:** This test suite is designed to validate the complete booking creation workflow including the recent UUID mapping fix and YYWWBCNN format implementation. It serves as both a functional test and a regression test to ensure the booking system works correctly.