import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const host = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const redirectUri = `${host}/api/line/link-callback`;
    const searchParams = req.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        return NextResponse.redirect(`${host}/instructor/dashboard?error=LineLinkRejected`);
    }

    if (!code) {
        return NextResponse.redirect(`${host}/instructor/dashboard?error=NoCode`);
    }

    try {
        const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: redirectUri,
                client_id: process.env.NEXT_PUBLIC_LINE_LOGIN_ID!,
                client_secret: process.env.LINE_LOGIN_SECRET!,
            }).toString(),
        });

        const tokenData = await tokenRes.json();
        if (tokenData.id_token) {
            const payloadStr = Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString('utf8');
            const payload = JSON.parse(payloadStr);
            const lineUserId = payload.sub;

            if (lineUserId) {
                // Check if lineUserId is already used
                const existingUser = await prisma.user.findFirst({
                    where: { lineUserId },
                    orderBy: { createdAt: 'asc' }
                });

                if (existingUser && existingUser.id !== session.user.id) {
                    // Check if the existing user is just a dummy uncompleted student account implicitly created
                    if (existingUser.role === "STUDENT" && existingUser.isProfileComplete === false) {
                        try {
                            // Merge or delete the dummy account to free up the lineUserId
                            await prisma.user.delete({ where: { id: existingUser.id } });
                            console.log(`[LINE Link] Deleted dummy student account ${existingUser.id} for lineId ${lineUserId}`);
                        } catch (e) {
                            console.error("[LINE Link] Failed to delete dummy student account. Archiving it instead.", e);
                            const archivedLineId = `archived_${Date.now()}_${lineUserId}`;
                            await prisma.user.update({
                                where: { id: existingUser.id },
                                data: { lineUserId: archivedLineId }
                            });
                        }
                    } else if (existingUser.role === "INSTRUCTOR" && existingUser.isActive === true) {
                        return NextResponse.redirect(`${host}/instructor/dashboard?error=InstructorAlreadyLinked`);
                    } else {
                        // Probably another student account
                        return NextResponse.redirect(`${host}/instructor/dashboard?error=AccountAlreadyLinked`);
                    }
                }

                // Actually link the line account to the current instructor
                await prisma.user.update({
                    where: { id: session.user.id },
                    data: { lineUserId }
                });

                return NextResponse.redirect(`${host}/instructor/dashboard?success=LineLinked`);
            }
        }

        return NextResponse.redirect(`${host}/instructor/dashboard?error=TokenExchangeFailed`);
    } catch (e) {
        console.error("LINE Link Callback Error:", e);
        return NextResponse.redirect(`${host}/instructor/dashboard?error=InternalError`);
    }
}
