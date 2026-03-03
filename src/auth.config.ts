import type { NextAuthConfig } from "next-auth";

const isSecureContext = process.env.NODE_ENV === "production" || !!process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://");

export const authConfig: NextAuthConfig = {
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET || "vhQzYpGX9dlG4DYdrxZ9dlr86f+mFzdn9fJhquHB0Ng=",
    cookies: {
        sessionToken: {
            name: `${isSecureContext ? "__Secure-" : ""}authjs.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: isSecureContext,
            },
        },
        callbackUrl: {
            name: `${isSecureContext ? "__Secure-" : ""}authjs.callback-url`,
            options: {
                sameSite: isSecureContext ? "none" : "lax",
                path: "/",
                secure: isSecureContext,
            },
        },
        csrfToken: {
            name: `${isSecureContext ? "__Host-" : ""}authjs.csrf-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: isSecureContext,
            },
        },
        pkceCodeVerifier: {
            name: `${isSecureContext ? "__Secure-" : ""}authjs.pkce.code_verifier`,
            options: {
                httpOnly: true,
                sameSite: isSecureContext ? "none" : "lax",
                path: "/",
                secure: isSecureContext,
                maxAge: 60 * 15, // 15 minutes
            },
        },
        state: {
            name: `${isSecureContext ? "__Secure-" : ""}authjs.state`,
            options: {
                httpOnly: true,
                sameSite: isSecureContext ? "none" : "lax",
                path: "/",
                secure: isSecureContext,
                maxAge: 60 * 15, // 15 minutes
            },
        },
        nonce: {
            name: `${isSecureContext ? "__Secure-" : ""}authjs.nonce`,
            options: {
                httpOnly: true,
                sameSite: isSecureContext ? "none" : "lax",
                path: "/",
                secure: isSecureContext,
            },
        },
    },
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
                    if (nextUrl.pathname.startsWith("/parent") && role !== "PARENT") return false;
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
