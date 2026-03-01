import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
        return NextResponse.json({ error: "Username required" }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" });
        }

        return NextResponse.json({
            id: user.id,
            username: user.username,
            passwordHash: user.passwordHash, // BE CAREFUL: This exposes the hash/password. For debugging ONLY.
            role: user.role,
            passwordLength: user.passwordHash.length,
            isBcrypt: user.passwordHash.startsWith('$2'),
            charCode0: user.passwordHash.charCodeAt(0),
        });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
