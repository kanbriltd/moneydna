import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analytics/:path*",
    "/coach/:path*",
    "/upload/:path*",
    "/today/:path*",
    "/discover/:path*",
    "/memory/:path*",
    "/goals/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/blueprint/:path*",
    "/simulator/:path*",
    "/pilot/:path*",
    "/twin/:path*",
    "/wealth-projection/:path*",
  ],
};
