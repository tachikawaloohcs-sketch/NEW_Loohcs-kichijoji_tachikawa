import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET || "vhQzYpGX9dlG4DYdrxZ9dlr86f+mFzdn9fJhquHB0Ng=",
    providers: [], // Configured in auth.ts to avoid edge runtime issues
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id || "";
                token.isProfileComplete = (user as any).isProfileComplete;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
                (session.user as any).isProfileComplete = token.isProfileComplete;
            }
            return session;
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.includes("/dashboard");
            const isOnSetupPage = nextUrl.pathname === "/setup-profile";
            const role = auth?.user?.role;
            const isProfileComplete = (auth?.user as any)?.isProfileComplete;

            // Removed middleware-level profile check to prevent redirect loops.
            // Profile completion check should be handled in page components using fresh DB data.

            // Dashboard logic
            if (isOnDashboard) {
                if (isLoggedIn) {
                    // Role Check
                    if (nextUrl.pathname.startsWith("/student") && role !== "STUDENT") return false;
                    if (nextUrl.pathname.startsWith("/instructor") && role !== "INSTRUCTOR") return false;
                    if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") return false;
                    return true;
                }
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Redirect logged-in users away from auth pages
                const isOnAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
                if (isOnAuthPage) {
                    return Response.redirect(new URL("/", nextUrl));
                }
            }
            return true;
        },
    },
};
