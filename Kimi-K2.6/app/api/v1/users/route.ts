import { db } from "@/db";
import * as schema from "@/db/schema";
import { getSession, unauthorized, json } from "@/lib/api-utils";

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Array of users
 *       401:
 *         description: Unauthorized
 */
export async function GET() {
  const session = await getSession();
  if (!session?.user) return unauthorized();

  const users = await db.select({ id: schema.user.id, name: schema.user.name, email: schema.user.email, image: schema.user.image }).from(schema.user);
  return json(users);
}
