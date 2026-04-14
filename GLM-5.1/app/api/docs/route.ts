import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: { title: "FlowBoard API", version: "1.0.0", description: "FlowBoard Project Management API" },
  servers: [{ url: "http://localhost:3000" }],
  paths: {
    "/api/v1/projects": {
      get: { summary: "List projects", tags: ["Projects"], responses: { "200": { description: "Array of projects" } } },
      post: { summary: "Create project", tags: ["Projects"], responses: { "201": { description: "Created project" } } },
    },
    "/api/v1/projects/{id}": {
      get: { summary: "Get project", tags: ["Projects"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] },
      put: { summary: "Update project", tags: ["Projects"] },
      delete: { summary: "Delete project", tags: ["Projects"] },
    },
    "/api/v1/boards/{id}": {
      get: { summary: "Get board with columns and issues", tags: ["Boards"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] },
      put: { summary: "Update board", tags: ["Boards"] },
      delete: { summary: "Delete board", tags: ["Boards"] },
    },
    "/api/v1/issues/{id}": {
      get: { summary: "Get issue with labels", tags: ["Issues"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }] },
      put: { summary: "Update issue", tags: ["Issues"] },
      delete: { summary: "Delete issue", tags: ["Issues"] },
    },
    "/api/v1/issues/{id}/move": {
      put: { summary: "Move issue to column/position", tags: ["Issues"] },
    },
    "/api/v1/sprints/{id}/start": {
      put: { summary: "Start sprint", tags: ["Sprints"] },
    },
    "/api/v1/sprints/{id}/complete": {
      put: { summary: "Complete sprint", tags: ["Sprints"] },
    },
  },
  components: {
    securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "session_token" } },
  },
  security: [{ cookieAuth: [] }],
};

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head><title>FlowBoard API Documentation</title>
<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body><div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>SwaggerUIBundle({spec:${JSON.stringify(spec)},dom_id:'#swagger-ui'});</script>
</body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
