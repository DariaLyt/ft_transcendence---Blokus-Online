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
    "email": "john@example.com"
  }
}
```

### Error Response

Status: 400 Bad Request

* Case 1 — Email already in use

```json
{
  "error": "Username or email already in use."
}
```

* Case 2 — Username already in use

```json
{
  "error": "Username already in use."
}
```

* Case 3 — Validation error

```json
{
  "error": [
    {
      "code": "invalid_type",
      "message": "Invalid input",
      "path": ["email"]
    }
  ]
}
```

Status: 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

## 🔵 LOGIN

POST /login

Logs a user into the application.

### Request

Content-Type: application/json

```json
{
  "email": "john@example.com",
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

### Error Response

Status: 400 Bad Request

```json
{
  "error": [
    {
      "code": "invalid_type",
      "message": "Invalid input",
      "path": ["email"]
    }
  ]
}
```

Status: 401 Unauthorized

```json
{
  "error": "Invalid credentials."
}
```

Status: 500 Internal Server Error

```json
{
  "error": "Internal server error"
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
