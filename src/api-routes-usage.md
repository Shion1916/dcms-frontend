# API Routes Usage Documentation

## Overview
The dental clinic management system uses Next.js API routes as a proxy layer to the Supabase functions. This provides better error handling, request/response transformation, and follows Next.js best practices.

## API Routes and Their Usage

### 1. `/app/api/appointments/available-slots/route.ts`
**Purpose:** Calculate available time slots for appointment booking based on service duration and buffer time.

**Used by:**
- ✅ `HomeBookingForm.tsx` - Line 60: `fetch('/api/appointments/available-slots')`

**Method:** POST  
**Request Body:**
```json
{
  "date": "2024-12-06",
  "serviceDuration": 60,
  "bufferTime": 15
}
```

**Response:**
```json
{
  "slots": [
    {
      "startTime": "09:00",
      "endTime": "10:15",
      "available": true
    }
  ],
  "metadata": {
    "date": "2024-12-06",
    "serviceDuration": 60,
    "bufferTime": 15,
    "totalSlotTime": 75,
    "existingAppointments": 2
  }
}
```

### 2. `/app/api/appointments/book/route.ts`
**Purpose:** Create a new appointment booking request.

**Used by:**
- ✅ `HomeBookingForm.tsx` - Line 134: `fetch('/api/appointments/book')`
- ✅ `BookingForm.tsx` - Line 71: `fetch('/api/appointments/book')`

**Method:** POST  
**Request Body (Smart Booking):**
```json
{
  "patientName": "John Smith",
  "patientEmail": "john@example.com",
  "patientPhone": "(555) 123-4567",
  "reason": "Routine Cleaning",
  "requestedDate": "2024-12-06",
  "requestedTimeSlot": "09:00-10:15",
  "serviceDuration": 60,
  "bufferTime": 15,
  "serviceDetails": {
    "id": "sc_1",
    "name": "Routine Cleaning",
    "description": "Comprehensive dental cleaning",
    "duration": 60,
    "buffer": 15
  },
  "needsStaffConfirmation": true,
  "type": "smart_booking_request"
}
```

**Request Body (Traditional Booking):**
```json
{
  "patientName": "John Smith",
  "patientEmail": "john@example.com",
  "patientPhone": "(555) 123-4567",
  "reason": "Dental checkup",
  "message": "Any additional notes",
  "type": "booking_request",
  "needsStaffConfirmation": true
}
```

### 3. `/app/api/appointments/route.ts`
**Purpose:** Get appointments list with role-based filtering.

**Used by:**
- ✅ `BookingForm.tsx` - Line 41: `fetch('/api/appointments?userEmail=${userEmail}&role=patient')`

**Method:** GET  
**Query Parameters:**
- `userEmail` (optional): Filter appointments for specific patient
- `role` (optional): Role-based filtering (patient, staff, dentist, admin)

## Other API Routes (Already in use)

### 4. `/app/api/appointments/[id]/confirm/route.ts`
**Purpose:** Confirm appointment bookings (staff/dentist/admin only)
**Used by:** Dashboard appointment management components

### 5. `/app/api/appointments/[id]/notes/route.ts`
**Purpose:** Add notes to appointments  
**Used by:** Appointment detail views

### 6. `/app/api/appointments/[id]/status/route.ts`
**Purpose:** Update appointment status
**Used by:** Appointment management components

### 7. `/app/api/auth/login/route.ts`
**Purpose:** User authentication
**Used by:** Login components

### 8. `/app/api/dentists/route.ts`
**Purpose:** Get dentist list
**Used by:** Various booking and scheduling components

### 9. `/app/api/patients/[id]/profile/route.ts`
**Purpose:** Patient profile management
**Used by:** Patient profile components

## Benefits of Using API Routes

1. **Error Handling:** Centralized error handling and user-friendly error messages
2. **Security:** No direct exposure of Supabase credentials to client
3. **Request/Response Transformation:** Can modify data before sending to client
4. **Logging:** Better logging and monitoring capabilities
5. **Caching:** Can implement caching strategies if needed
6. **Rate Limiting:** Can add rate limiting in the future
7. **Validation:** Server-side validation of requests

## Migration Summary

### Before (Direct Supabase calls):
```typescript
fetch(`https://${projectId}.supabase.co/functions/v1/make-server-c89a26e4/available-slots`, {
  headers: { 'Authorization': `Bearer ${publicAnonKey}` }
})
```

### After (API Routes):
```typescript
fetch('/api/appointments/available-slots', {
  headers: { 'Content-Type': 'application/json' }
})
```

## Components Updated

1. ✅ **HomeBookingForm.tsx** - Now uses API routes for slot calculation and booking
2. ✅ **BookingForm.tsx** - Now uses API routes for appointment checking and booking
3. ⚠️ **BookAppointment.tsx** - Still uses mock data simulation (needs API integration)

## Next Steps

- Consider updating `BookAppointment.tsx` to use real API calls
- Add error handling and retry logic to API routes
- Implement request validation and sanitization
- Add logging and monitoring to track API usage