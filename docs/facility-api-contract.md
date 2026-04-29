# Facility Screen API Contract

This file is the source-of-truth for facility-related frontend API integration.

Rules:
- Use only endpoints defined below.
- Do not invent or substitute endpoint paths.
- Keep request methods, payloads, query params, and access rules exactly as documented.
- Update this file first if backend contracts change.

## Applicants

### POST /applicants
- Access: authenticated with facility access (or admin)
- Request: multipart/form-data
  - name: string
  - email: string
  - phoneNumber: string (optional)
  - role: string
  - facilityId: number
  - status: ApplicantStatus (optional)
  - notes: string (optional)
  - resume: file (required)
- Response: 201 Created with ApplicantResponse

### GET /applicants
- Access: authenticated
- Query:
  - facilityId: number (optional)
  - status: ApplicantStatus (optional)
  - role: string (optional)
  - fromDate: yyyy-MM-dd (optional)
  - toDate: yyyy-MM-dd (optional)
  - page: number (default 0)
  - size: number (default 20)
  - sort: string (default addedDate,desc)
- Response: 200 OK with Page<ApplicantResponse>

### GET /applicants/{applicantId}
- Access: authenticated with facility access (or admin)
- Response: 200 OK with ApplicantResponse

### PATCH /applicants/{applicantId}/status
- Access: authenticated with facility access (or admin)
- Body:
  - status: ApplicantStatus
  - notes: string (optional)
- Response: 200 OK with ApplicantResponse

### PUT /applicants/{applicantId}
- Access: authenticated with facility access (or admin)
- Request: multipart/form-data
  - name: string (optional)
  - email: string (optional)
  - phoneNumber: string (optional)
  - role: string (optional)
  - notes: string (optional)
  - resume: file (optional)
- Response: 200 OK with ApplicantResponse

### GET /applicants/{applicantId}/resume
- Access: authenticated with facility access (or admin)
- Response: 200 OK with file stream

### POST /applicants/{applicantId}/interviews
- Access: authenticated with facility access (or admin)
- Body:
  - scheduledDate: ISO datetime
  - durationMinutes: 60
  - interviewType: string
  - notes: string (optional)
  - generateMeetingLink: true
  - sendCalendarInvites: true
  - sendEmailNotifications: true
- Response: 201 Created with ApplicantInterviewResponse

### PATCH /applicants/{applicantId}/interviews/{interviewId}/complete
- Access: authenticated with facility access (or admin)
- Body:
  - completed: true
  - noShow: false
  - notes: string (optional)
  - newStatus: ApplicantStatus (optional)
- Response: 200 OK with ApplicantInterviewResponse

### POST /applicants/{applicantId}/orientation
- Access: authenticated with facility access (or admin)
- Body:
  - scheduledDate: ISO datetime
  - durationMinutes: 120
  - documentsRequired: [string (optional)]
  - generateMeetingLink: true
  - sendEmailNotifications: true
- Response: 201 Created with ApplicantOrientationResponse

### PATCH /applicants/{applicantId}/orientation/{orientationId}/complete
- Access: authenticated with facility access (or admin)
- Body:
  - completed: true
  - noShow: false
  - notes: string (optional)
- Response: 200 OK with ApplicantOrientationResponse

### PATCH /applicants/bulk/status
- Access: authenticated
- Body:
  - applicantIds: [1,2,3]
  - status: ApplicantStatus
  - notes: string (optional)
- Response: 200 OK with BulkStatusUpdateResponse

### GET /applicants/stats
- Access: authenticated
- Query:
  - facilityId: number (optional)
  - fromDate: yyyy-MM-dd (optional)
  - toDate: yyyy-MM-dd (optional)
- Response: 200 OK with ApplicantStatsResponse

### GET /applicants/search
- Access: authenticated
- Query:
  - q: string (required)
  - facilityId: number (optional)
  - status: ApplicantStatus (optional)
  - limit: number (default 20)
- Example: /applicants/search?q=term
- Response: 200 OK with ApplicantResponse[]

### POST /applicants/{applicantId}/resend-notification
- Access: authenticated with facility access (or admin)
- Body:
  - notificationType: INTERVIEW_SCHEDULED | ORIENTATION_SCHEDULED | HIRED | STATUS_UPDATE
- Response: 200 OK with NotificationResponse

## Calendar

### GET /calendar/interviews
- Access: authenticated
- Query:
  - facilityId: number (optional)
  - startDate: ISO datetime (required)
  - endDate: ISO datetime (required)
  - status: string (optional)
  - interviewType: string (optional)
  - view: month | week | day | agenda (default month)
- Response: 200 OK with CalendarEventsResponse

### GET /calendar/interviews/upcoming
- Access: authenticated
- Query:
  - facilityId: number (optional)
  - days: number (default 7)
  - limit: number (default 50)
- Response: 200 OK with UpcomingInterviewsResponse

### GET /calendar/interviews/{interviewId}
- Access: authenticated with facility access (or admin)
- Response: 200 OK with CalendarEventDto

### GET /calendar/export
- Access: authenticated
- Query:
  - facilityId: number (optional)
  - startDate: yyyy-MM-dd (required)
  - endDate: yyyy-MM-dd (required)
  - format: ics | csv | json (default ics)
- Response: 200 OK with downloadable file bytes

### POST /calendar/sync-external
- Access: admin only
- Body:
  - facilityId: number
  - calendarType: string
  - accessToken: string
  - refreshToken: string (optional)
- Response: 200 OK with ExternalSyncResponse

### POST /calendar/meeting-link/{interviewId}/regenerate
- Access: authenticated with facility access (or admin)
- Body: optional
  - sendUpdateNotifications: true
- Response: 200 OK with RegenerateMeetingLinkResponse

### POST /calendar/reminders/send-now/{interviewId}
- Access: authenticated with facility access (or admin)
- Body:
  - reminderType: 24h | 1h
- Response: 200 OK with ReminderSentResponse

### POST /calendar/availability/check
- Access: authenticated with facility access (or admin)
- Body:
  - facilityId: number
  - startDateTime: ISO datetime
  - endDateTime: ISO datetime
- Response: 200 OK with AvailabilityResponse
