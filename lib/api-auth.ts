import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { Session } from "next-auth";

export async function requireAuth(): Promise<
  { session: Session; response?: never } | { session?: never; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session };
}

export async function requireRole(
  allowedRoles: Role[]
): Promise<
  | { session: Session; response?: never }
  | { session?: never; response: NextResponse }
> {
  const result = await requireAuth();
  if ("response" in result) return result;

  const role = result.session.user.role as Role;
  if (!role || !allowedRoles.includes(role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return result;
}
