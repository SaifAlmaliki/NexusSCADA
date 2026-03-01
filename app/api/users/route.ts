import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  const result = await requireRole(["ADMIN", "MANAGER"]);
  if ("response" in result) return result.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status"); // ACTIVE | DISABLED
    const role = searchParams.get("role"); // ADMIN | MANAGER | ENGINEER | OPERATOR

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) {
      where.status = status;
    }
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      include: { site: { select: { id: true, name: true, location: true } } },
      orderBy: { name: "asc" },
    });

    const safeUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      siteId: u.siteId,
      site: u.site,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const result = await requireRole(["ADMIN"]);
  if ("response" in result) return result.response;

  try {
    const body = await request.json();
    const { email, name, password, role, siteId } = body;

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, password" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const validRoles: Role[] = ["ADMIN", "MANAGER", "ENGINEER", "OPERATOR"];
    const userRole = role && validRoles.includes(role) ? role : "OPERATOR";

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: userRole,
        siteId: siteId || null,
      },
      include: { site: { select: { id: true, name: true, location: true } } },
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          siteId: user.siteId,
          site: user.site,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
