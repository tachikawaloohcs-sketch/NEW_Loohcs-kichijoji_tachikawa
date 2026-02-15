import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Line from "next-auth/providers/line";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/auth.config";

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Line({
            clientId: process.env.NEXT_PUBLIC_LINE_LOGIN_ID,
            clientSecret: process.env.LINE_LOGIN_SECRET,
            authorization: { params: { scope: "profile openid" } },
        }),
        Credentials({
            async authorize(credentials) {
                if (credentials.id && credentials.password === "next-auth-bypass") {
                    // Bypass for testing if needed
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                if (!email || !password) return null;

                const user = await prisma.user.findUnique({ where: { email } });
                if (!user) return null;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (user && Object.prototype.hasOwnProperty.call(user, 'isActive') && !(user as any).isActive) {
                    console.log("User is inactive");
                    return null;
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((user as any).archivedAt) {
                    console.log("User is archived");
                    return null;
                }

                // Admin Login Restriction
                if (user.role === "ADMIN" && user.email !== "tachikawa.loohcs@gmail.com") {
                    console.log("Unauthorized admin login attempt");
                    return null;
                }

                // Check if user has a password (might be LINE-only)
                if (!user.password) {
                    console.log("User has no password (LINE-only account)");
                    return null;
                }

                const passwordsMatch = await bcrypt.compare(password, user.password);
                if (passwordsMatch) return user;

                console.log("Invalid credentials");
                return null;
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "line") {
                const lineUserId = profile?.sub as string;
                if (!lineUserId) return false;

                // Find user by LINE ID
                let dbUser = await prisma.user.findUnique({
                    where: { lineUserId: lineUserId }
                });

                if (!dbUser) {
                    // Auto-create as STUDENT if not found
                    dbUser = await prisma.user.create({
                        data: {
                            lineUserId: lineUserId,
                            name: profile?.name as string || user.name,
                            imageUrl: (profile as any)?.picture || user.image,
                            role: "STUDENT",
                            isActive: true,
                        }
                    });
                }

                // Set database info to user object so JWT callback can pick it up
                user.id = dbUser.id;
                user.role = dbUser.role;
                return true;
            }
            return true; // Allow credentials
        },
        ...authConfig.callbacks,
    }
});
