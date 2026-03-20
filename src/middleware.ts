export { auth as middleware } from "@/lib/auth/auth";

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|log.png|f/).*)",
  ],
};
