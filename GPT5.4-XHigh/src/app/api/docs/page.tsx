import { getApiDocs } from "@/src/lib/openapi";
import { SwaggerViewer } from "@/src/shared/ui/docs/SwaggerViewer";

export default async function ApiDocsPage() {
  const spec = await getApiDocs();

  return <SwaggerViewer spec={spec} />;
}
