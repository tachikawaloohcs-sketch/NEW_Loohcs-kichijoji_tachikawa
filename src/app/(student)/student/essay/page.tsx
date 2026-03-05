import LocusPreview from "@/components/locus/LocusPreview";
import { auth } from "@/auth";

export default async function EssayLocusPage() {
    const session = await auth();
    const userRole = session?.user?.role || "STUDENT";

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800">
            <LocusPreview userRole={userRole} initialTab="ESSAY" />
        </div>
    );
}
