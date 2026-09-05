# Authentication API

Base URL:

http://localhost:3000/api/auth

## 🟢 REGISTER

POST /register

Creates a new user account.

### Request

Content-Type: application/json

```json
{
  "username": "john",
  "email": "john@example.com",
  "password": "mypassword123"
}
```

### Success Response

Status: 201 Created

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
	"created_at": "2026-08-22T14:30:00.000Z"
  }
}
```

### Endpoint-Specific Errors

Status: 400 Bad Request

* Case 1 — Email already in use

```json
{
  "error": "Username or email already in use"
}
```

* Case 2 — Username already in use

```json
{
  "error": "Username already in use"
}
```

## 🔵 LOGIN

POST /login

Logs a user into the application.

### Request

Content-Type: application/json

```json
{
  "identifier": "john@example.com",
  "password": "mypassword123"
}
```

### Success Response

Status: 200 Successful

```json
{
  "message": "Logged in sucessfully",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com"
  }
}
```

### Endpoint-Specific Errors

Status: 401 Unauthorized

```json
{
  "error": "Invalid credentials"
}
```

## 🔴 LOGOUT

POST /logout

Logs out the currently authenticated user.

### Request

No body required.

### Success Response

Status: 200

```json
{
  "message": "Logged out successfully"
}
```

## 🟣 GET CURRENT USER PROFILE

GET /me

Returns the profile of the currently authenticated user.

**Authentication required:** Yes

### Request

No body required.

A valid authentication token is required.

### Success Response

Status: 200 OK

```json
{
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
	"created_at": "2026-08-22T14:30:00.000Z"
  }
}
```

### Endpoint-Specific Errors

Status: 404 Not Found

```json
{
  "error": "User not found"
}
```

## 🟠 CHANGE PASSWORD

PUT /me/password

Changes the password of the currently authenticated user.

**Authentication required:** Yes

### Request

Content-Type: application/json

```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

### Success Response

Status: 200 Successful

```json
{
  "message": "Password updated successfully"
}
```

### Endpoint-Specific Errors

Status: 400 Bad Request

* Case 1 — Incorrect current password

```json
{
  "error": "Incorrect current password"
}
```

Status: 404 Not Found

```json
{
  "error": "User not found"
}
```

## 🟡 HEALTH CHECK

GET /

Checks whether the API is running and the database is connected.

### Request

No body required.

### Success Response

Status: 200 OK

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

# Common Errors

The following errors are handled globally by the application's middleware.

These responses can occur on multiple endpoints and therefore are documented here instead of being repeated in every endpoint.

---

## 400 Bad Request — Validation Error

Returned when the request body fails Zod validation.

The validation middleware validates the request before the controller is executed. If validation fails, the error is passed to the global error handler.

```json
{
  "error": "Validation Error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

The `details` array contains the fields that failed validation.

---

## 400 Bad Request — Invalid JSON

Returned when the request contains malformed JSON.

```json
{
  "error": "Invalid JSON payload"
}
```

---

# Common Errors

The following errors are handled globally by the application's error-handling middleware.

These responses can occur on multiple endpoints and therefore are documented here instead of being repeated in every endpoint.

---

## 400 Bad Request — Validation Error

Returned when the request body fails Zod validation.

The validation middleware validates the request before the controller is executed. If validation fails, the `ZodError` is passed to the global error handler.

The error handler returns the Zod `issues` directly in the `details` field.

Example:

```json
{
  "error": "Validation Error",
  "details": [
    {
      "code": "invalid_format",
      "format": "email",
      "path": [
        "email"
      ],
      "message": "Invalid email address"
    }
  ]
}
```

The exact contents of the `details` array depend on the validation error produced by the Zod schema.

---

## 400 Bad Request — Invalid JSON Payload

Returned when the request contains malformed JSON.

```json
{
  "error": "Invalid JSON payload"
}
```

---

## 401 Unauthorized

Returned when authentication is required but the request does not contain a valid authentication token.

```json
{
  "error": "Unauthorized"
}
```

---

## 404 Not Found — Route Not Found

Returned when the requested endpoint does not exist.

```json
{
  "error": "Route not found"
}
```

---

## 500 Internal Server Error

Returned when an unexpected server error occurs.

### Production

```json
{
  "error": "Internal Server Error"
}
```

### Development

When `NODE_ENV=development`, the response also includes the error message.

```json
{
  "error": "Internal Server Error",
  "message": "Database connection failed"
}
```

The `message` field is omitted when `NODE_ENV` is not `development`.