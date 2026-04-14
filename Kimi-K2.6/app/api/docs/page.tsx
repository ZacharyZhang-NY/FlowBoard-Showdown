import { createSwaggerSpec } from "next-swagger-doc";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

const spec = createSwaggerSpec({
  apiFolder: "app/api",
  definition: {
    openapi: "3.1.0",
    info: {
      title: "FlowBoard API",
      version: "1.0.0",
    },
  },
});

export default function ApiDocsPage() {
  return (
    <div style={{ padding: "1rem" }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
