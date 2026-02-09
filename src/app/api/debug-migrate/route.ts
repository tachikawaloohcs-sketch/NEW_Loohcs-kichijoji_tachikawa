
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
        console.log("Starting manual migration via API...");
        // Use the global prisma command as we set it up in Dockerfile
        const { stdout, stderr } = await execAsync('prisma db push --accept-data-loss --schema=./prisma/schema.prisma');
        console.log("Migration STDOUT:", stdout);
        console.log("Migration STDERR:", stderr);

        return NextResponse.json({
            success: true,
            stdout,
            stderr
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
