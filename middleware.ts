import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/users",
    "/orders/:path*",
    "/batches/:path*",
    "/scada/:path*",
    "/maintenance/:path*",
    "/quality/:path*",
    "/inventory/:path*",
    "/documents/:path*",
    "/fleet/:path*",
    "/settings/:path*",
    "/production/:path*",
    "/operator/:path*",
    "/traceability/:path*",
  ],
};
