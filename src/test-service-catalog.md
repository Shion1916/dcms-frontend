# Service Catalog API Testing Guide

## Updated Supabase Server Function

The Supabase server function has been updated to support the new service catalog fields:
- `estimated_duration` (number): Time in minutes for the procedure
- `buffer_time` (number): Additional time for preparation/cleanup

## API Endpoints Updated

### 1. POST `/make-server-c89a26e4/services-catalog`
**Create new service**

Required fields:
- `name` (string)
- `description` (string) 
- `base_price` (number)
- `has_treatment_detail` (boolean)
- `estimated_duration` (number) - NEW
- `buffer_time` (number) - NEW

Example request:
```json
{
  "name": "Routine Cleaning",
  "description": "Comprehensive dental cleaning",
  "base_price": 120,
  "has_treatment_detail": false,
  "estimated_duration": 60,
  "buffer_time": 15
}
```

### 2. PUT `/make-server-c89a26e4/services-catalog/:id`
**Update existing service**

All fields are optional in updates:
- `name`, `description`, `base_price`, `has_treatment_detail`
- `estimated_duration` (number) - NEW
- `buffer_time` (number) - NEW

Example request:
```json
{
  "estimated_duration": 90,
  "buffer_time": 20
}
```

### 3. GET `/make-server-c89a26e4/services-catalog`
**Get all services**

Returns services with all fields including the new time fields.

## Demo Data Updated

The initialization demo data now includes 10 complete services with realistic time estimates:

1. **Routine Cleaning**: 60min + 15min buffer
2. **Dental Filling**: 45min + 15min buffer
3. **Root Canal Treatment**: 90min + 30min buffer
4. **Teeth Whitening**: 75min + 15min buffer
5. **Tooth Extraction**: 30min + 20min buffer
6. **Dental Crown**: 120min + 30min buffer
7. **Orthodontic Consultation**: 45min + 15min buffer
8. **Dental Bridge**: 150min + 30min buffer
9. **Periodontal Treatment**: 90min + 20min buffer
10. **Dental Implant**: 180min + 45min buffer

## Testing Steps

1. **Health Check**: Call GET `/make-server-c89a26e4/health` to verify server is running
2. **Get Services**: Call GET `/make-server-c89a26e4/services-catalog` to see demo data
3. **Create Service**: Test POST with all required fields including new time fields
4. **Update Service**: Test PUT to update time fields on existing service
5. **Frontend Integration**: Verify the frontend services page displays and manages the new fields correctly

## Frontend Integration

The frontend `/app/dashboard/services/page.tsx` has been updated to:
- Display duration and buffer time columns in the services table
- Include time fields in add/edit forms with validation
- Show average duration and buffer time in stats cards
- Handle the new fields in all CRUD operations

The integration should now work seamlessly between frontend and backend.