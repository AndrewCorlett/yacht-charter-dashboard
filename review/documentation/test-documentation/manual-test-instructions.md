# Manual Test Instructions for Gap-Filling Logic

## Current Status
- The application is running at http://localhost:5173
- Form elements are working correctly
- Automated form filling had issues, so manual testing is recommended

## Test Steps

### 1. Check Current Bookings
From the browser console output, I can see there are already bookings in the system. Look at the "UPCOMING CHARTERS" section on the page to see existing bookings.

### 2. Create Second Booking for Zavaria
Fill out the form with the following details:

**Yacht:** zavaria
**First Name:** Jane
**Surname:** TestUser2
**Email:** jane.test2@example.com
**Phone:** +44 1234 567891
**Address Line 1:** 124 Test Street
**Address Line 2:** (leave empty)
**City:** Test City
**Postcode:** TC1 2ST
**Charter Type:** Bareboat
**Start Date:** 2025-07-06
**End Date:** 2025-07-13
**Port of Departure:** Largs Marina
**Port of Arrival:** Largs Marina

### 3. Expected Results
- **Expected booking code:** 2527ZA02
- **Previous booking code should be:** 2527ZA01
- Both bookings should be visible in the "UPCOMING CHARTERS" section

### 4. What to Check
1. After clicking "Quick Create", look for a success message
2. Check the booking code generated (should follow the pattern 2527ZA##)
3. Verify both bookings appear in the UPCOMING CHARTERS section
4. Confirm the sequence number incremented correctly from 01 to 02

### 5. Gap-Filling Logic Test
The gap-filling logic should:
- Find the highest sequence number for yacht "zavaria" in week 27 of 2025
- Increment it by 1
- Generate booking code 2527ZA02 for the second booking

## Notes
- The browser is currently open and ready for manual testing
- The form validation is working correctly
- All form elements are accessible and functional