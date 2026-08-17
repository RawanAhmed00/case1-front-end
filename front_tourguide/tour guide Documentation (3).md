# Smart AI Travel Planner — API Documentation

## Base URL

```text
{{baseUrl}}
```

## Authentication

Protected endpoints require a Bearer Token:

```http
Authorization: Bearer <token>
Accept: application/json
```

---

# 1. Chat API

All chat endpoints require authentication.

## Get Chats

```http
GET /chats
```

Returns the authenticated user's conversations.

### Headers

```http
Authorization: Bearer <token>
Accept: application/json
```

### Success Response — 200

```json
{
    "data": [
        {
            "id": 1,
            "user_id": 5,
            "name": "Tour Guide",
            "last_message": "Hello",
            "created_at": "2026-08-12T12:00:00Z"
        }
    ]
}
```

---

## Get Chat Messages

```http
GET /chats/{id}
```

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes | Chat ID |

### Success Response — 200

```json
{
    "data": [
        {
            "id": 1,
            "sender_id": 5,
            "receiver_id": 8,
            "trip_id": null,
            "message": "Hello",
            "is_read": false,
            "sender": {
                "id": 5,
                "name": "John"
            },
            "created_at": "2026-08-12T12:00:00Z"
        }
    ]
}
```

The current Postman collection confirms the response structure includes `sender_id`, `receiver_id`, `trip_id`, `message`, `is_read`, sender information, and `created_at`.

---

## Send Message

```http
POST /chats/{id}/messages
```

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes | Chat ID |

### Request Body

```json
{
    "message": "Hello, I need help with my trip",
    "trip_id": 10
}
```

### Body Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `message` | string | Yes | Message content |
| `trip_id` | integer/null | No | Related trip ID |

### Success Response — 201

```json
{
    "status": "success",
    "data": {
        "id": 1,
        "sender_id": 5,
        "receiver_id": 8,
        "trip_id": 10,
        "message": "Hello, I need help with my trip",
        "is_read": false,
        "created_at": "2026-08-12T12:00:00Z"
    }
}
```

The Postman collection defines this endpoint as `POST /chats/:id/messages`, with `message` and `trip_id` in the request body, and documents `201 Created`, `401 Unauthorized`, and `422 Validation Error` responses. 
---

## Mark Chat as Read

```http
PUT /chats/{id}/read
```

Marks the messages in the specified chat as read.

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes | Chat ID |

### Success Response — 200

```json
{
    "status": "success",
    "message": "Messages marked as read"
}
```

The endpoint is also present in the current Postman collection as `PUT /chats/:id/read`.

---

## Get Unread Messages Count

```http
GET /chats/unread-count
```

Returns the number of unread messages for the authenticated user.

### Success Response — 200

```json
{
    "unread_count": 5
}
```

The Postman collection documents this endpoint and its `unread_count` response field.

---

## Delete Message

```http
DELETE /chats/messages/{id}
```

Deletes a message belonging to the authenticated user.

### Path Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | integer | Yes | Message ID |

### Success Response — 200

```json
{
    "status": "success"
}
```

The current collection uses `DELETE /chats/messages/:messageId` and documents a `200 OK` response.

---

# 2. Tour Guide API

All endpoints in this section require:

```text
auth:api
guide
throttle:api
```

---

## Tour Guide Dashboard

```http
GET /dashboard
```

Returns dashboard information for the authenticated tour guide.

### Headers

```http
Authorization: Bearer <token>
Accept: application/json
```

---

## Get Tour Guide Requests

```http
GET /requests
```

Returns booking/request information received by the tour guide.

---

## Get Request

```http
GET /requests/{id}
```

### Path Parameters

| Parameter | Type | Required |
|---|---|---|
| `id` | integer | Yes |

---

## Accept Request

```http
PATCH /requests/{id}/accept
```

Accepts a tour guide request.

### Path Parameters

| Parameter | Type | Required |
|---|---|---|
| `id` | integer | Yes |

---

## Reject Request

```http
PATCH /requests/{id}/reject
```

Rejects a tour guide request.

### Path Parameters

| Parameter | Type | Required |
|---|---|---|
| `id` | integer | Yes |

---

# 3. Tour Guide Availability

## Get Availabilities

```http
GET /availabilities
```

Returns the tour guide's availability records.

### Success Response — 200

```json
{
    "data": [
        {
            "id": 1,
            "tour_guide_id": 5
        }
    ]
}
```

The Postman collection documents this endpoint as returning an array of availability resources.

---

## Create Availability

```http
POST /availabilities
```

Creates a new availability record for the authenticated tour guide.

---

## Update Availability

```http
PUT /availabilities/{id}
```

Updates an existing availability record.

---

## Delete Availability

```http
DELETE /availabilities/{id}
```

Deletes an availability record.

### Success Response — 200

```json
{
    "success": true,
    "message": "Availability deleted successfully"
}
```

The collection documents a successful `200 OK` response and an unauthenticated `401` response for this endpoint.

---

# 4. Tour Guide Schedule

```http
GET /tour-guide/schedule
```

Returns the authenticated tour guide's schedule.

### Success Response — 200

```json
{
    "success": true,
    "data": {}
}
```

The endpoint is present in the Postman collection as `GET /tour-guide/schedule`.

---

# 5. Tour Guide Earnings

## Get Earnings

```http
GET /tour-guide/earnings
```

Returns the tour guide's earnings information.

---

## Earnings History

```http
GET /tour-guide/earnings/history
```

Returns the tour guide's earnings history.

---

# 6. Tour Guide Reviews

## Get Reviews

```http
GET /tour-guide/reviews
```

Returns reviews associated with the authenticated tour guide.

---

## Get Rating

```http
GET /tour-guide/rating
```

Returns the tour guide's rating information.

---

# Authentication Errors

Protected endpoints may return:

### 401 Unauthorized

```json
{
    "message": "Unauthenticated"
}
```

The Postman collection contains `401 Unauthorized` examples for the protected Chat and Tour Guide endpoints.

---

# Validation Errors

Endpoints that validate request data may return:

### 422 Unprocessable Entity

```json
{
    "message": "The given data was invalid.",
    "errors": {
        "field": [
            "The field is required."
        ]
    }
}
```

The existing Postman collection includes `422` validation-error examples for the Chat API.