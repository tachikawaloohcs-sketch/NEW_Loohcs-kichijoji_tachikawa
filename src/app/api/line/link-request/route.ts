import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const clientId = process.env.NEXT_PUBLIC_LINE_LOGIN_ID;
    // Replace trailing slash if necessary
    const host = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const redirectUri = `${host}/api/line/link-callback`;

    const url = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=link&scope=profile%20openid%20email`;

    return NextResponse.redirect(url);
}
