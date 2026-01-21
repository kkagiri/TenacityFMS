# JsReport API Reference

## Base URL

```
/api/v1/reportgenerator
```

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Template Management

### List Templates

Get a list of all available template names.

**Request:**
```http
GET /api/v1/reportgenerator/templates
```

**Response:**
```json
{
  "isSuccess": true,
  "data": [
    "pump-transaction-report",
    "daily-fuel-summary",
    "vehicle-consumption-report"
  ],
  "message": null,
  "error": null
}
```

---

### Get Template Content

Retrieve the HTML content of a specific template.

**Request:**
```http
GET /api/v1/reportgenerator/templates/{name}
```

**Parameters:**
| Name | Type | Location | Description |
|------|------|----------|-------------|
| name | string | path | Template name (without .html extension) |

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "name": "pump-transaction-report",
    "content": "<!DOCTYPE html>..."
  },
  "message": null,
  "error": null
}
```

**Error Responses:**
- `404 Not Found` - Template does not exist

---

### Save Template

Create or update a template.

**Request:**
```http
POST /api/v1/reportgenerator/templates/{name}
Content-Type: application/json

{
  "content": "<!DOCTYPE html>..."
}
```

**Parameters:**
| Name | Type | Location | Description |
|------|------|----------|-------------|
| name | string | path | Template name (alphanumeric and hyphens only) |
| content | string | body | HTML template content |

**Response:**
```json
{
  "isSuccess": true,
  "data": null,
  "message": "Template saved successfully",
  "error": null
}
```

**Validation:**
- Template name must match: `^[a-zA-Z0-9-]+$`
- Content cannot be empty

---

### Delete Template

Remove a template from the system.

**Request:**
```http
DELETE /api/v1/reportgenerator/templates/{name}
```

**Parameters:**
| Name | Type | Location | Description |
|------|------|----------|-------------|
| name | string | path | Template name to delete |

**Response:**
```json
{
  "isSuccess": true,
  "data": null,
  "message": "Template deleted successfully",
  "error": null
}
```

---

## Report Rendering

### Render to PDF

Generate a PDF document from a template with provided data.

**Request:**
```http
POST /api/v1/reportgenerator/render/pdf/{name}
Content-Type: application/json

{
  "reportTitle": "My Report",
  "data": [...]
}
```

**Parameters:**
| Name | Type | Location | Description |
|------|------|----------|-------------|
| name | string | path | Template name |
| (body) | object | body | Data object for template rendering |

**Response:**
- Content-Type: `application/pdf`
- Body: Binary PDF content

---

### Render to Excel

Generate an Excel document from a template with provided data.

**Request:**
```http
POST /api/v1/reportgenerator/render/excel/{name}
Content-Type: application/json

{
  "reportTitle": "My Report",
  "data": [...]
}
```

**Parameters:**
| Name | Type | Location | Description |
|------|------|----------|-------------|
| name | string | path | Template name |
| (body) | object | body | Data object for template rendering |

**Response:**
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Body: Binary Excel content

---

### Preview as HTML

Generate an HTML preview of a template with provided data.

**Request:**
```http
POST /api/v1/reportgenerator/preview/{name}
Content-Type: application/json

{
  "reportTitle": "My Report",
  "data": [...]
}
```

**Parameters:**
| Name | Type | Location | Description |
|------|------|----------|-------------|
| name | string | path | Template name |
| (body) | object | body | Data object for template rendering |

**Response:**
- Content-Type: `text/html`
- Body: Rendered HTML string

---

### Render Inline Template

Render a template provided in the request body (without saving).

**Request:**
```http
POST /api/v1/reportgenerator/render/inline
Content-Type: application/json

{
  "template": "<!DOCTYPE html>...",
  "data": {
    "reportTitle": "My Report"
  }
}
```

**Parameters:**
| Name | Type | Location | Description |
|------|------|----------|-------------|
| template | string | body | HTML template content |
| data | object | body | Data object for template rendering |

**Response:**
- Content-Type: `application/pdf`
- Body: Binary PDF content

---

## Specialized Reports

### Pump Transaction Report

Generate a comprehensive pump transaction report with filters.

**Request:**
```http
POST /api/v1/reportgenerator/pump-transactions
Content-Type: application/json

{
  "dateFrom": "2026-01-01",
  "dateTo": "2026-01-21",
  "siteId": 1,
  "vehicleId": null,
  "tankId": null,
  "fuelGradeId": null,
  "format": "pdf"
}
```

**Parameters:**
| Name | Type | Required | Description |
|------|------|----------|-------------|
| dateFrom | string (date) | No | Start date (default: 30 days ago) |
| dateTo | string (date) | No | End date (default: today) |
| siteId | integer | No | Filter by site |
| vehicleId | integer | No | Filter by vehicle |
| tankId | integer | No | Filter by tank |
| fuelGradeId | integer | No | Filter by fuel grade |
| format | string | No | Output format: "pdf", "excel", or "html" (default: "pdf") |

**Response:**
Varies by format:
- `pdf`: `application/pdf`
- `excel`: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `html`: `text/html`

---

## Error Responses

All error responses follow the FMSResponse format:

```json
{
  "isSuccess": false,
  "data": null,
  "message": null,
  "error": "Error description"
}
```

### Common Error Codes

| HTTP Status | Description |
|-------------|-------------|
| 400 Bad Request | Invalid request parameters |
| 401 Unauthorized | Missing or invalid authentication |
| 404 Not Found | Template not found |
| 500 Internal Server Error | Server-side rendering error |

---

## Rate Limiting

Report generation is resource-intensive. Recommended limits:
- Maximum 10 concurrent report generations per user
- Maximum report size: 10,000 records
- Request timeout: 60 seconds

---

## Examples

### cURL Examples

**List templates:**
```bash
curl -X GET "https://api.fms.example.com/api/v1/reportgenerator/templates" \
  -H "Authorization: Bearer <token>"
```

**Generate PDF:**
```bash
curl -X POST "https://api.fms.example.com/api/v1/reportgenerator/render/pdf/pump-transaction-report" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reportTitle": "Test Report"}' \
  --output report.pdf
```

**Save template:**
```bash
curl -X POST "https://api.fms.example.com/api/v1/reportgenerator/templates/my-report" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "<!DOCTYPE html><html>...</html>"}'
```

---

*Last Updated: January 21, 2026*
