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
            authorization: { params: { scope: "profile openid email" } },
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
                if (passwordsMatch) {
                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        isProfileComplete: user.isProfileComplete,
                    };
                }

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
                const email = (profile as any)?.email as string | undefined;

                // 1. Find user by LINE ID first
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let dbUser = await (prisma.user as any).findFirst({
                    where: { lineUserId: lineUserId }
                });

                // 2. If not found by LINE ID, try to find by email and link
                if (!dbUser && email) {
                    dbUser = await prisma.user.findUnique({ where: { email } });
                    if (dbUser) {
                        console.log(`[LINE Login] Linking existing ${dbUser.role} account (${email}) with LINE ID: ${lineUserId}`);
                        // Link existing user - preserve their role (STUDENT, INSTRUCTOR, or ADMIN)
                        await prisma.user.update({
                            where: { id: dbUser.id },
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            data: {
                                lineUserId: lineUserId,
                                name: (profile as any)?.name || dbUser.name,
                                imageUrl: (profile as any)?.picture || dbUser.imageUrl,
                            } as any
                        });
                        console.log(`[LINE Login] Successfully linked ${dbUser.role} account with LINE notifications enabled`);
                    }
                }

                // 3. If still not found, create new user as STUDENT
                if (!dbUser) {
                    console.log(`[LINE Login] Creating new STUDENT account for LINE ID: ${lineUserId}`);
                    dbUser = await prisma.user.create({
                        data: {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            lineUserId: lineUserId as any,
                            name: (profile as any)?.name || user.name || "新規ユーザー",
                            email: email,
                            imageUrl: (profile as any)?.picture || user.image,
                            role: "STUDENT",
                            isActive: true,
                            isProfileComplete: false,
                        } as any
                    });
                } else if (dbUser.lineUserId === lineUserId) {
                    // User already linked, just update profile info if needed
                    await prisma.user.update({
                        where: { id: dbUser.id },
                        data: {
                            name: (profile as any)?.name || dbUser.name,
                            imageUrl: (profile as any)?.picture || dbUser.imageUrl,
                        }
                    });
                }

                if (!dbUser) return false;

                // Check if user is active
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if (Object.prototype.hasOwnProperty.call(dbUser, 'isActive') && !(dbUser as any).isActive) {
                    console.log(`[LINE Login] User account is inactive: ${dbUser.email}`);
                    return false;
                }

                // Check if user is archived
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((dbUser as any).archivedAt) {
                    console.log(`[LINE Login] User account is archived: ${dbUser.email}`);
                    return false;
                }

                // Set database info to user object so JWT callback can pick it up
                (user as any).id = dbUser.id;
                (user as any).role = dbUser.role;
                (user as any).isProfileComplete = dbUser.isProfileComplete;
                console.log(`[LINE Login] Successful login as ${dbUser.role}: ${dbUser.email || dbUser.name}`);
                return true;
            }
            return true; // Allow credentials
        },
        ...authConfig.callbacks,
    }
});
