
export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary/80 border-t-transparent"></div>
            <p className="text-muted-foreground animate-pulse font-medium">読み込み中...</p>
        </div>
    );
}
