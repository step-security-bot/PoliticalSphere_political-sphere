# API Documentation

## Overview

The Political Sphere API is documented using OpenAPI 3.0 specification.

## Accessing the Documentation

### Development

The API documentation is available at:
- **OpenAPI spec**: `/apps/api/openapi.yaml`
- **Swagger UI**: Can be served via `swagger-ui-express` (see setup below)

### Setup Swagger UI (Optional)

To serve interactive API documentation:

```bash
npm install swagger-ui-express
```

Then add to your API server:

```typescript
import swaggerUi from 'swagger-ui-express';
import { readFileSync } from 'fs';
import { parse } from 'yaml';

const openApiSpec = parse(readFileSync('./openapi.yaml', 'utf8'));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
```

Access at: `http://localhost:3000/api-docs`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Users
- `POST /api/users` - Create user
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Bills
- `POST /api/bills` - Create bill
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get bill by ID

### Parties
- `POST /api/parties` - Create party
- `GET /api/parties` - Get all parties
- `GET /api/parties/:id` - Get party by ID

### Votes
- `POST /api/votes` - Create vote

## Authentication

Most endpoints require JWT bearer token authentication.

**Header format:**
```
Authorization: Bearer <token>
```

Obtain tokens via:
- `POST /auth/register` - Returns access and refresh tokens
- `POST /auth/login` - Returns access and refresh tokens

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Auth endpoints: 5 requests per 15 minutes per IP
- Other endpoints: 100 requests per 15 minutes per IP

## Error Responses

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "details": {}
}
```

Common status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid auth)
- `404` - Not Found
- `500` - Internal Server Error

## Validation

Request bodies are validated using Zod schemas. Invalid requests return `400` with validation details.

## Testing

Use the OpenAPI spec with tools like:
- **Postman**: Import `openapi.yaml`
- **curl**: See examples below
- **httpie**: Modern CLI HTTP client

### Example Requests

**Register user:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

**Create party (with auth):**
```bash
curl -X POST http://localhost:3000/api/parties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{"name":"Test Party","color":"#FF0000","description":"A test party"}'
```

## Further Reading

- [OpenAPI Specification](https://swagger.io/specification/)
- [API Security Best Practices](../../docs/06-security-and-risk/api-security.md)
- [Rate Limiting Documentation](../../docs/06-security-and-risk/rate-limiting.md)
