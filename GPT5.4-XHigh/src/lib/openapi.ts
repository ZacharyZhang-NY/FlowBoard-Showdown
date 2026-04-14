import { createSwaggerSpec } from "next-swagger-doc";

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const jsonSchema = (schema: Record<string, unknown>) => ({ "application/json": { schema } });
const dataEnvelope = (schema: Record<string, unknown>) => ({
  type: "object",
  properties: { data: schema, meta: { type: "object", additionalProperties: true } },
  required: ["data"],
});
const okResponse = (schema: Record<string, unknown>, description = "Success") => ({
  description,
  content: jsonSchema(dataEnvelope(schema)),
});
const errorResponse = (description: string) => ({
  description,
  content: jsonSchema({ type: "object", properties: { error: ref("Error") }, required: ["error"] }),
});
const parameter = (name: string) => ({ name, in: "path", required: true, schema: { type: "string" } });
const authSecurity = [{ SessionAuth: [] }];
const arrayOf = (schema: Record<string, unknown>) => ({ type: "array", items: schema });
const standardErrors = {
  "401": errorResponse("Authentication required"),
  "403": errorResponse("Forbidden"),
  "404": errorResponse("Not found"),
  "409": errorResponse("Conflict"),
  "422": errorResponse("Validation failed"),
};

export async function getApiDocs(): Promise<object> {
  return createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.1.1",
      info: {
        title: "FlowBoard API",
        version: "1.0.0",
        description: "Contract-first API for the local-first FlowBoard application.",
      },
      servers: [{ url: "http://localhost:3000" }],
      components: {
        securitySchemes: {
          SessionAuth: { type: "apiKey", in: "cookie", name: "better-auth.session_token" },
        },
        schemas: {
          Error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" }, details: {}, requestId: { type: "string" } }, required: ["code", "message"] },
          DeleteResult: { type: "object", properties: { id: { type: "string" }, deletedAt: { type: "string", format: "date-time" } }, required: ["id", "deletedAt"] },
          UserSummary: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, email: { type: "string", format: "email" }, role: { type: "string" }, image: { type: "string", nullable: true } }, required: ["id", "name", "email", "role", "image"] },
          ActivityItem: { type: "object", properties: { id: { type: "string" }, action: { type: "string" }, requestId: { type: "string" }, createdAt: { type: "string", format: "date-time" }, actor: ref("UserSummary"), issueId: { type: "string", nullable: true }, issueKey: { type: "string", nullable: true }, issueTitle: { type: "string", nullable: true }, oldValue: { type: "string", nullable: true }, newValue: { type: "string", nullable: true } }, required: ["id", "action", "requestId", "createdAt", "actor", "issueId", "issueKey", "issueTitle", "oldValue", "newValue"] },
          Tag: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, color: { type: "string" } }, required: ["id", "name", "color"] },
          ProjectSummary: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, key: { type: "string" }, description: { type: "string", nullable: true }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" }, boardCount: { type: "integer" }, openIssueCount: { type: "integer" } }, required: ["id", "name", "key", "description", "createdAt", "updatedAt", "boardCount", "openIssueCount"] },
          ProjectDetail: { allOf: [ref("ProjectSummary"), { type: "object", properties: { createdBy: ref("UserSummary"), currentSprintId: { type: "string", nullable: true } }, required: ["createdBy", "currentSprintId"] }] },
          ProjectMember: { type: "object", properties: { projectId: { type: "string" }, role: { type: "string" }, user: ref("UserSummary") }, required: ["projectId", "role", "user"] },
          DashboardSummary: { type: "object", properties: { openIssues: { type: "object" }, myAssigned: { type: "object" }, overdue: { type: "object" }, activeSprint: { type: "object" }, recentActivity: arrayOf(ref("ActivityItem")) }, required: ["openIssues", "myAssigned", "overdue", "activeSprint", "recentActivity"] },
          BoardSummary: { type: "object", properties: { id: { type: "string" }, projectId: { type: "string" }, name: { type: "string" }, position: { type: "integer" }, issueCount: { type: "integer" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } }, required: ["id", "projectId", "name", "position", "issueCount", "createdAt", "updatedAt"] },
          Column: { type: "object", properties: { id: { type: "string" }, boardId: { type: "string" }, name: { type: "string" }, color: { type: "string" }, position: { type: "integer" }, wipLimit: { type: "integer", nullable: true }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } }, required: ["id", "boardId", "name", "color", "position", "wipLimit", "createdAt", "updatedAt"] },
          IssueSummary: { type: "object", properties: { id: { type: "string" }, projectId: { type: "string" }, boardId: { type: "string" }, columnId: { type: "string", nullable: true }, sprintId: { type: "string", nullable: true }, number: { type: "integer" }, key: { type: "string" }, title: { type: "string" }, description: { type: "string", nullable: true }, status: { type: "string" }, priority: { type: "string" }, type: { type: "string" }, storyPoints: { type: "integer", nullable: true }, dueDate: { type: "string", format: "date-time", nullable: true }, position: { type: "integer" }, version: { type: "integer" }, assignee: { oneOf: [ref("UserSummary"), { type: "null" }] }, reporter: ref("UserSummary"), labels: arrayOf(ref("Tag")), createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } }, required: ["id", "projectId", "boardId", "columnId", "sprintId", "number", "key", "title", "description", "status", "priority", "type", "storyPoints", "dueDate", "position", "version", "assignee", "reporter", "labels", "createdAt", "updatedAt"] },
          Comment: { type: "object", properties: { id: { type: "string" }, issueId: { type: "string" }, author: ref("UserSummary"), content: { type: "string" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } }, required: ["id", "issueId", "author", "content", "createdAt", "updatedAt"] },
          IssueDetail: { allOf: [ref("IssueSummary"), { type: "object", properties: { comments: arrayOf(ref("Comment")), activity: arrayOf(ref("ActivityItem")) }, required: ["comments", "activity"] }] },
          BoardDetail: { type: "object", properties: { id: { type: "string" }, projectId: { type: "string" }, name: { type: "string" }, position: { type: "integer" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" }, columns: arrayOf({ allOf: [ref("Column"), { type: "object", properties: { issues: arrayOf(ref("IssueSummary")) }, required: ["issues"] }] }) }, required: ["id", "projectId", "name", "position", "createdAt", "updatedAt", "columns"] },
          SprintDetail: { type: "object", properties: { id: { type: "string" }, projectId: { type: "string" }, name: { type: "string" }, goal: { type: "string", nullable: true }, status: { type: "string" }, startDate: { type: "string", format: "date-time", nullable: true }, endDate: { type: "string", format: "date-time", nullable: true }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" }, totalStoryPoints: { type: "integer" }, completedStoryPoints: { type: "integer" }, issuesByStatus: { type: "object" } }, required: ["id", "projectId", "name", "goal", "status", "startDate", "endDate", "createdAt", "updatedAt", "totalStoryPoints", "completedStoryPoints", "issuesByStatus"] },
          Label: { type: "object", properties: { id: { type: "string" }, projectId: { type: "string" }, name: { type: "string" }, color: { type: "string" }, createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" } }, required: ["id", "projectId", "name", "color", "createdAt", "updatedAt"] },
          BurndownResponse: { type: "object", properties: { ideal: arrayOf({ type: "object" }), actual: arrayOf({ type: "object" }) }, required: ["ideal", "actual"] },
          VelocityResponse: { type: "object", properties: { items: arrayOf({ type: "object" }) }, required: ["items"] },
          DistributionResponse: { type: "object", properties: { items: arrayOf({ type: "object" }) }, required: ["items"] },
          PriorityBreakdownResponse: { type: "object", properties: { items: arrayOf({ type: "object" }) }, required: ["items"] },
          CumulativeFlowResponse: { type: "object", properties: { items: arrayOf({ type: "object" }) }, required: ["items"] },
          AuthSession: { type: "object", properties: { session: { type: "object" }, user: ref("UserSummary") }, required: ["session", "user"] },
        },
      },
      paths: {
        "/api/auth/sign-in/email": { post: { tags: ["Auth"], summary: "Sign in with email and password", security: [], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { email: { type: "string" }, password: { type: "string" } }, required: ["email", "password"] }) }, responses: { "200": { description: "Authenticated session cookie issued" }, "401": errorResponse("Invalid credentials") } } },
        "/api/auth/sign-out": { post: { tags: ["Auth"], summary: "Sign out current session", responses: { "200": { description: "Session cleared" } } } },
        "/api/auth/get-session": { get: { tags: ["Auth"], summary: "Get current session", responses: { "200": { description: "Current session", content: jsonSchema(ref("AuthSession")) } } } },
        "/api/v1/projects": {
          get: { tags: ["Projects"], summary: "List accessible projects", security: authSecurity, responses: { "200": okResponse({ type: "object", properties: { items: arrayOf(ref("ProjectSummary")) }, required: ["items"] }), ...standardErrors } },
          post: { tags: ["Projects"], summary: "Create project", security: authSecurity, requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" }, key: { type: "string" }, description: { type: "string", nullable: true } }, required: ["name", "key"] }) }, responses: { "201": okResponse(ref("ProjectDetail"), "Created"), ...standardErrors } },
        },
        "/api/v1/projects/{id}": {
          get: { tags: ["Projects"], summary: "Get project detail", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("ProjectDetail")), ...standardErrors } },
          put: { tags: ["Projects"], summary: "Update project", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" }, key: { type: "string" }, description: { type: "string", nullable: true } } }) }, responses: { "200": okResponse(ref("ProjectDetail")), ...standardErrors } },
          delete: { tags: ["Projects"], summary: "Delete project", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("DeleteResult")), ...standardErrors } },
        },
        "/api/v1/projects/{id}/dashboard": { get: { tags: ["Projects"], summary: "Get dashboard summary", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("DashboardSummary")), ...standardErrors } } },
        "/api/v1/projects/{id}/members": { get: { tags: ["Projects"], summary: "List project members", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse({ type: "object", properties: { items: arrayOf(ref("ProjectMember")) }, required: ["items"] }), ...standardErrors } } },
        "/api/v1/projects/{id}/activity": { get: { tags: ["Projects"], summary: "Get recent project activity", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(arrayOf(ref("ActivityItem"))), ...standardErrors } } },
        "/api/v1/projects/{id}/boards": {
          get: { tags: ["Boards"], summary: "List project boards", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse({ type: "object", properties: { items: arrayOf(ref("BoardSummary")) }, required: ["items"] }), ...standardErrors } },
          post: { tags: ["Boards"], summary: "Create board", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" } }, required: ["name"] }) }, responses: { "201": okResponse(ref("BoardDetail"), "Created"), ...standardErrors } },
        },
        "/api/v1/boards/{id}": {
          get: { tags: ["Boards"], summary: "Get board detail", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("BoardDetail")), ...standardErrors } },
          put: { tags: ["Boards"], summary: "Update board", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" } } }) }, responses: { "200": okResponse(ref("BoardDetail")), ...standardErrors } },
          delete: { tags: ["Boards"], summary: "Delete board", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("DeleteResult")), ...standardErrors } },
        },
        "/api/v1/boards/{boardId}/columns": { post: { tags: ["Columns"], summary: "Create board column", security: authSecurity, parameters: [parameter("boardId")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" }, color: { type: "string" }, wipLimit: { type: "integer", nullable: true } }, required: ["name"] }) }, responses: { "201": okResponse(ref("BoardDetail"), "Created"), ...standardErrors } } },
        "/api/v1/columns/{id}": {
          put: { tags: ["Columns"], summary: "Update column", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" }, color: { type: "string" }, wipLimit: { type: "integer", nullable: true }, position: { type: "integer" } } }) }, responses: { "200": okResponse(ref("BoardDetail")), ...standardErrors } },
          delete: { tags: ["Columns"], summary: "Delete column", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("BoardDetail")), ...standardErrors } },
        },
        "/api/v1/columns/reorder": { put: { tags: ["Columns"], summary: "Reorder columns", security: authSecurity, requestBody: { required: true, content: jsonSchema({ type: "object", properties: { boardId: { type: "string" }, columnIds: arrayOf({ type: "string" }) }, required: ["boardId", "columnIds"] }) }, responses: { "200": okResponse(ref("BoardDetail")), ...standardErrors } } },
        "/api/v1/projects/{id}/issues": {
          get: { tags: ["Issues"], summary: "List project issues", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse({ type: "object", properties: { items: arrayOf(ref("IssueSummary")), meta: { type: "object" } }, required: ["items", "meta"] }), ...standardErrors } },
          post: { tags: ["Issues"], summary: "Create issue", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { boardId: { type: "string" }, columnId: { type: "string", nullable: true }, sprintId: { type: "string", nullable: true }, title: { type: "string" }, description: { type: "string", nullable: true }, priority: { type: "string" }, status: { type: "string" }, type: { type: "string" }, assigneeId: { type: "string", nullable: true }, storyPoints: { type: "integer", nullable: true }, dueDate: { type: "string", format: "date-time", nullable: true }, labelIds: arrayOf({ type: "string" }) }, required: ["boardId", "title"] }) }, responses: { "201": okResponse(ref("IssueDetail"), "Created"), ...standardErrors } },
        },
        "/api/v1/issues/{id}": {
          get: { tags: ["Issues"], summary: "Get issue detail", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("IssueDetail")), ...standardErrors } },
          put: { tags: ["Issues"], summary: "Update issue", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { boardId: { type: "string" }, columnId: { type: "string", nullable: true }, sprintId: { type: "string", nullable: true }, title: { type: "string" }, description: { type: "string", nullable: true }, priority: { type: "string" }, status: { type: "string" }, type: { type: "string" }, assigneeId: { type: "string", nullable: true }, storyPoints: { type: "integer", nullable: true }, dueDate: { type: "string", format: "date-time", nullable: true }, labelIds: arrayOf({ type: "string" }), version: { type: "integer" } }, required: ["version"] }) }, responses: { "200": okResponse(ref("IssueDetail")), ...standardErrors } },
          delete: { tags: ["Issues"], summary: "Delete issue", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("DeleteResult")), ...standardErrors } },
        },
        "/api/v1/issues/{id}/move": { put: { tags: ["Issues"], summary: "Move issue to column and position", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { boardId: { type: "string" }, columnId: { type: "string", nullable: true }, position: { type: "integer" }, version: { type: "integer" } }, required: ["boardId", "columnId", "position", "version"] }) }, responses: { "200": okResponse(ref("IssueDetail")), ...standardErrors } } },
        "/api/v1/issues/reorder": { put: { tags: ["Issues"], summary: "Batch reorder issues", security: authSecurity, requestBody: { required: true, content: jsonSchema({ type: "object", properties: { boardId: { type: "string" }, columnId: { type: "string", nullable: true }, issueIds: arrayOf({ type: "string" }) }, required: ["boardId", "columnId", "issueIds"] }) }, responses: { "200": okResponse({ type: "object", properties: { boardId: { type: "string" }, columnId: { type: "string", nullable: true }, issueIds: arrayOf({ type: "string" }) }, required: ["boardId", "columnId", "issueIds"] }), ...standardErrors } } },
        "/api/v1/issues/{id}/comments": {
          get: { tags: ["Comments"], summary: "List issue comments", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse({ type: "object", properties: { items: arrayOf(ref("Comment")) }, required: ["items"] }), ...standardErrors } },
          post: { tags: ["Comments"], summary: "Create comment", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { content: { type: "string" } }, required: ["content"] }) }, responses: { "201": okResponse(ref("Comment"), "Created"), ...standardErrors } },
        },
        "/api/v1/comments/{id}": {
          put: { tags: ["Comments"], summary: "Update comment", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { content: { type: "string" } }, required: ["content"] }) }, responses: { "200": okResponse(ref("Comment")), ...standardErrors } },
          delete: { tags: ["Comments"], summary: "Delete comment", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("DeleteResult")), ...standardErrors } },
        },
        "/api/v1/issues/{id}/activity": { get: { tags: ["Activity"], summary: "Get issue activity", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse({ type: "object", properties: { items: arrayOf(ref("ActivityItem")) }, required: ["items"] }), ...standardErrors } } },
        "/api/v1/projects/{id}/sprints": {
          get: { tags: ["Sprints"], summary: "List sprints", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse({ type: "object", properties: { items: arrayOf(ref("SprintDetail")) }, required: ["items"] }), ...standardErrors } },
          post: { tags: ["Sprints"], summary: "Create sprint", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" }, goal: { type: "string", nullable: true } }, required: ["name"] }) }, responses: { "201": okResponse(ref("SprintDetail"), "Created"), ...standardErrors } },
        },
        "/api/v1/sprints/{id}": { put: { tags: ["Sprints"], summary: "Update sprint", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" }, goal: { type: "string", nullable: true } } }) }, responses: { "200": okResponse(ref("SprintDetail")), ...standardErrors } } },
        "/api/v1/sprints/{id}/start": { put: { tags: ["Sprints"], summary: "Start sprint", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { startDate: { type: "string", format: "date-time" }, endDate: { type: "string", format: "date-time" } }, required: ["startDate", "endDate"] }) }, responses: { "200": okResponse(ref("SprintDetail")), ...standardErrors } } },
        "/api/v1/sprints/{id}/complete": { put: { tags: ["Sprints"], summary: "Complete sprint", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { moveIncompleteIssuesToBacklog: { type: "boolean" } } }) }, responses: { "200": okResponse(ref("SprintDetail")), ...standardErrors } } },
        "/api/v1/projects/{id}/labels": {
          get: { tags: ["Labels"], summary: "List labels", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse({ type: "object", properties: { items: arrayOf(ref("Label")) }, required: ["items"] }), ...standardErrors } },
          post: { tags: ["Labels"], summary: "Create label", security: authSecurity, parameters: [parameter("id")], requestBody: { required: true, content: jsonSchema({ type: "object", properties: { name: { type: "string" }, color: { type: "string" } }, required: ["name", "color"] }) }, responses: { "201": okResponse(ref("Label"), "Created"), ...standardErrors } },
        },
        "/api/v1/labels/{id}": { delete: { tags: ["Labels"], summary: "Delete label", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("DeleteResult")), ...standardErrors } } },
        "/api/v1/projects/{id}/reports/burndown": { get: { tags: ["Reports"], summary: "Get burndown data", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("BurndownResponse")), ...standardErrors } } },
        "/api/v1/projects/{id}/reports/velocity": { get: { tags: ["Reports"], summary: "Get velocity data", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("VelocityResponse")), ...standardErrors } } },
        "/api/v1/projects/{id}/reports/distribution": { get: { tags: ["Reports"], summary: "Get issue distribution", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("DistributionResponse")), ...standardErrors } } },
        "/api/v1/projects/{id}/reports/priority-breakdown": { get: { tags: ["Reports"], summary: "Get priority breakdown", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("PriorityBreakdownResponse")), ...standardErrors } } },
        "/api/v1/projects/{id}/reports/cumulative-flow": { get: { tags: ["Reports"], summary: "Get cumulative flow data", security: authSecurity, parameters: [parameter("id")], responses: { "200": okResponse(ref("CumulativeFlowResponse")), ...standardErrors } } },
      },
    },
  });
}
