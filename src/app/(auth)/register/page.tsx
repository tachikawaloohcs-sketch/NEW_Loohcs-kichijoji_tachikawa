"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function RegisterButton() {
    const { pending } = useFormStatus();
    return (
        <Button className="w-full" aria-disabled={pending}>
            {pending ? "登録中..." : "登録する"}
        </Button>
    );
}

export default function RegisterPage() {
    const [errorMessage, dispatch] = useActionState(register, undefined);
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState("STUDENT");

    useEffect(() => {
        router.push("/login");
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p className="text-muted-foreground">ログインページへ移動しています...</p>
        </div>
    );
}
