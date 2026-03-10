# API Reference - A.S.T.R.A Backend

## Authentication Endpoints

### 1. Signup
Creates a new user account.

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "age": 30,
  "gender": "male"
}
```

**Response (200 OK):**
```json
{
  "id": "user-id-123",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30,
  "gender": "male",
  "createdAt": "2026-03-07T10:30:00Z"
}
```

**Headers:** Session cookie automatically set

---

### 2. Login
Authenticates a user and creates a session.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200 OK):**
```json
{
  "id": "user-id-123",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30,
  "gender": "male",
  "createdAt": "2026-03-07T10:30:00Z"
}
```

**Headers:** Session cookie automatically set

---

### 3. Logout
Terminates the user session.

**Endpoint:** `POST /api/auth/logout`

**Request:** No body required

**Response (200 OK):**
```json
{
  "success": true
}
```

**Headers:** Session cookie cleared

---

### 4. Get Current User
Retrieves the authenticated user's information.

**Endpoint:** `GET /api/auth/me`

**Request:** No body required

**Headers Required:**
- Cookie: `sessionId=[session-id]`

**Response (200 OK):**
```json
{
  "id": "user-id-123",
  "email": "user@example.com",
  "name": "John Doe",
  "age": 30,
  "gender": "male",
  "createdAt": "2026-03-07T10:30:00Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

---

## Health Data Endpoints

### 5. Add Health Reading
Records a new temperature reading with AI analysis.

**Endpoint:** `POST /api/health/data`

**Request Body:**
```json
{
  "temperature": 37.5,
  "aiResponse": "Normal body temperature. Continue daily monitoring for consistent health tracking."
}
```

**Request Headers:**
```
Content-Type: application/json
Cookie: sessionId=[session-id]
```

**Response (200 OK):**
```json
{
  "id": "reading-id-456",
  "temperature": 37.5,
  "aiResponse": "Normal body temperature. Continue daily monitoring for consistent health tracking.",
  "timestamp": "2026-03-07T14:45:30Z"
}
```

**Error Responses:**
- `400 Bad Request`: Missing temperature or aiResponse
- `401 Unauthorized`: Invalid or missing session

---

### 6. Get Health History
Retrieves all health readings for the authenticated user.

**Endpoint:** `GET /api/health/data`

**Request:** No body required

**Request Headers:**
```
Cookie: sessionId=[session-id]
```

**Response (200 OK):**
```json
[
  {
    "id": "reading-id-456",
    "temperature": 37.5,
    "aiResponse": "Normal body temperature. Continue daily monitoring.",
    "timestamp": "2026-03-07T14:45:30Z"
  },
  {
    "id": "reading-id-455",
    "temperature": 37.2,
    "aiResponse": "Temperature is within normal range.",
    "timestamp": "2026-03-07T14:15:00Z"
  }
]
```

**Response:** Array sorted by timestamp (newest first)

**Error Responses:**
- `401 Unauthorized`: Invalid or missing session

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error description"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (auth required) |
| 404 | Not Found |
| 500 | Server Error |

---

## ESP32 Integration Example

### JavaScript/Node.js (for testing)

```javascript
// Test signup
fetch('http://localhost:3000/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    age: 25,
    gender: 'male'
  })
});

// Test login
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});

// Add health data
fetch('http://localhost:3000/api/health/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    temperature: 37.5,
    aiResponse: 'Normal temperature detected.'
  })
});

// Get health history
fetch('http://localhost:3000/api/health/data', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(data => console.log(data));
```

### cURL Examples

```bash
# Signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "age": 25,
    "gender": "male"
  }' \
  -c cookies.txt

# Add health data
curl -X POST http://localhost:3000/api/health/data \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "temperature": 37.5,
    "aiResponse": "Normal temperature."
  }'

# Get health history
curl -X GET http://localhost:3000/api/health/data \
  -b cookies.txt
```

---

## Rate Limiting

Currently no rate limiting implemented. For production, add:
- 10 requests per minute for auth endpoints
- 30 requests per minute for health data endpoints

---

## Authentication Flow

```
1. User Signup → POST /api/auth/signup
   ↓ Creates user and session
2. Get Current User → GET /api/auth/me
   ↓ Returns user info
3. Add Health Data → POST /api/health/data
   ↓ Stores temperature + AI response
4. Get History → GET /api/health/data
   ↓ Returns all readings
5. Logout → POST /api/auth/logout
   ↓ Clears session
```

---

## Important Notes

- **Session Duration:** 24 hours
- **Session Storage:** Cookies (httpOnly, SameSite=Lax)
- **Database:** Currently in-memory (development only)
- **Password Protection:** NOT hashed in current version (use bcrypt in production)
- **HTTPS:** Required in production
- **CORS:** Currently configured for local development

---

## Best Practices for ESP32

1. Store session cookie from first authentication
2. Send session cookie with all subsequent requests
3. Handle 401 responses by re-authenticating
4. Send readings at regular intervals (every 30-60 seconds recommended)
5. Validate temperature sensor readings before sending
6. Implement retry logic for failed requests
7. Log errors for debugging
