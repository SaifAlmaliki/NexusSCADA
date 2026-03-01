import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole(["ADMIN", "MANAGER"]);
  if ("response" in result) return result.response;

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { site: { select: { id: true, name: true, location: true } } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      siteId: user.siteId,
      site: user.site,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole(["ADMIN"]);
  if ("response" in result) return result.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { name, email, role, status, siteId } = body;

    const data: Record<string, unknown> = {};
    if (typeof name === "string") data.name = name;
    if (typeof email === "string") {
      if (email !== existingUser.email) {
        const taken = await prisma.user.findUnique({ where: { email } });
        if (taken) {
          return NextResponse.json(
            { error: "Email already in use" },
            { status: 409 }
          );
        }
        data.email = email;
      }
    }
    if (role && ["ADMIN", "MANAGER", "ENGINEER", "OPERATOR"].includes(role)) {
      data.role = role;
    }
    if (status && ["ACTIVE", "DISABLED"].includes(status)) {
      data.status = status;
    }
    if (siteId !== undefined) {
      data.siteId = siteId === "" || siteId === null ? null : siteId;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { site: { select: { id: true, name: true, location: true } } },
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        siteId: user.siteId,
        site: user.site,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireRole(["ADMIN"]);
  if ("response" in result) return result.response;

  try {
    const { id } = await params;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { status: "DISABLED" },
    });

    return NextResponse.json({
      message: "User disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
