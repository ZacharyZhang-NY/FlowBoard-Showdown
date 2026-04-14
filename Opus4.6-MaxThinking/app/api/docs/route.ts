import { NextResponse } from "next/server";

const swaggerSpec = {
  openapi: "3.1.0",
  info: {
    title: "FlowBoard API",
    version: "1.0.0",
    description: "Team Project Management Board API",
  },
  servers: [{ url: "http://localhost:3000", description: "Local" }],
  paths: {
    "/api/auth/sign-in/email": {
      post: {
        summary: "Login",
        tags: ["Authentication"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: { "200": { description: "Login successful" } },
      },
    },
    "/api/v1/projects": {
      get: {
        summary: "List all projects",
        tags: ["Projects"],
        responses: { "200": { description: "Array of projects" } },
      },
      post: {
        summary: "Create project",
        tags: ["Projects"],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  key: { type: "string" },
                  description: { type: "string" },
                },
                required: ["name", "key"],
              },
            },
          },
        },
        responses: { "201": { description: "Project created" } },
      },
    },
    "/api/v1/projects/{id}": {
      get: { summary: "Get project", tags: ["Projects"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Project details" } } },
      put: { summary: "Update project", tags: ["Projects"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Project updated" } } },
      delete: { summary: "Delete project", tags: ["Projects"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Project deleted" } } },
    },
    "/api/v1/projects/{id}/boards": {
      get: { summary: "List boards", tags: ["Boards"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Array of boards" } } },
      post: { summary: "Create board", tags: ["Boards"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "201": { description: "Board created" } } },
    },
    "/api/v1/boards/{id}": {
      get: { summary: "Get board with columns and issues", tags: ["Boards"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Board with columns and issues" } } },
      put: { summary: "Update board", tags: ["Boards"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Board updated" } } },
      delete: { summary: "Delete board", tags: ["Boards"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Board deleted" } } },
    },
    "/api/v1/projects/{id}/issues": {
      get: { summary: "List issues (filterable)", tags: ["Issues"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }, { name: "priority", in: "query", schema: { type: "string" } }, { name: "type", in: "query", schema: { type: "string" } }, { name: "assigneeId", in: "query", schema: { type: "string" } }, { name: "sprintId", in: "query", schema: { type: "string" } }, { name: "search", in: "query", schema: { type: "string" } }, { name: "page", in: "query", schema: { type: "integer" } }, { name: "limit", in: "query", schema: { type: "integer" } }], responses: { "200": { description: "Paginated issues list" } } },
      post: { summary: "Create issue", tags: ["Issues"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "201": { description: "Issue created" } } },
    },
    "/api/v1/issues/{id}": {
      get: { summary: "Get issue detail", tags: ["Issues"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Issue details" } } },
      put: { summary: "Update issue", tags: ["Issues"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Issue updated" } } },
      delete: { summary: "Delete issue", tags: ["Issues"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Issue deleted" } } },
    },
    "/api/v1/issues/{id}/move": {
      put: { summary: "Move issue to column + position", tags: ["Issues"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Issue moved" } } },
    },
    "/api/v1/projects/{id}/sprints": {
      get: { summary: "List sprints", tags: ["Sprints"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Array of sprints" } } },
      post: { summary: "Create sprint", tags: ["Sprints"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "201": { description: "Sprint created" } } },
    },
    "/api/v1/sprints/{id}/start": {
      put: { summary: "Start sprint", tags: ["Sprints"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Sprint started" } } },
    },
    "/api/v1/sprints/{id}/complete": {
      put: { summary: "Complete sprint", tags: ["Sprints"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Sprint completed" } } },
    },
    "/api/v1/issues/{id}/comments": {
      get: { summary: "List comments", tags: ["Comments"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Array of comments" } } },
      post: { summary: "Create comment", tags: ["Comments"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "201": { description: "Comment created" } } },
    },
    "/api/v1/issues/{id}/activity": {
      get: { summary: "Get issue activity log", tags: ["Activity"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Activity log entries" } } },
    },
    "/api/v1/projects/{id}/labels": {
      get: { summary: "List labels", tags: ["Labels"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Array of labels" } } },
      post: { summary: "Create label", tags: ["Labels"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "201": { description: "Label created" } } },
    },
    "/api/v1/projects/{id}/reports/burndown": {
      get: { summary: "Sprint burndown data", tags: ["Reports"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Burndown chart data" } } },
    },
    "/api/v1/projects/{id}/reports/velocity": {
      get: { summary: "Velocity chart data", tags: ["Reports"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Velocity chart data" } } },
    },
    "/api/v1/projects/{id}/reports/distribution": {
      get: { summary: "Issue distribution data", tags: ["Reports"], parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Distribution chart data" } } },
    },
  },
};

export async function GET() {
  // Serve an HTML page with Swagger UI
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FlowBoard API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      spec: ${JSON.stringify(swaggerSpec)},
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
