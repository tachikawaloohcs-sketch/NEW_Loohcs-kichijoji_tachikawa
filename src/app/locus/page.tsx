import LocusPreview from "@/components/locus/LocusPreview";
import { auth } from "@/auth";

export default async function LocusLabPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const session = await auth();
    const userRole = session?.user?.role || "STUDENT";

    // Await searchParams in Next.js 15
    const params = await searchParams;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800">
            <LocusPreview userRole={userRole} initialTab={params.tab as any} />
        </div>
    );
}
