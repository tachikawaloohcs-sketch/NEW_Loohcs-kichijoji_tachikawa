
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== 'loohcs-admin-fix-2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log("Starting manual migration via API (Async Mode)...");

        // Execute in background without awaiting
        execAsync('prisma db push --accept-data-loss --schema=./prisma/schema.prisma')
            .then(({ stdout, stderr }) => {
                console.log("Async Migration Success:");
                console.log("STDOUT:", stdout);
                if (stderr) console.log("STDERR:", stderr);
            })
            .catch((error) => {
                console.error("Async Migration Failed:", error);
            });

        return NextResponse.json({
            success: true,
            message: "Migration started in background. Please check server logs in Google Cloud Console in 30-60 seconds."
        });
    } catch (error) {
        console.error("Migration failed:", error);
        return NextResponse.json({
            success: false,
            error: String(error),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            details: (error as any).message
        }, { status: 500 });
    }
}
