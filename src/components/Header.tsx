"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info } from "lucide-react";

interface HeaderProps {
    rightSlot?: React.ReactNode;
}

export default function Header({ rightSlot }: HeaderProps) {
    const pathname = usePathname();

    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-teal-700 transition-colors">D</div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">
                        Edge Dent Seg
                        <span className="text-slate-400 font-normal text-sm ml-2">Clinical Suite</span>
                    </span>
                </Link>

                {/* Nav Links */}
                <nav className="flex items-center gap-1 ml-4">
                    <Link
                        href="/"
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${pathname === "/"
                            ? "bg-teal-50 text-teal-700"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        Workspace
                    </Link>
                    <Link
                        href="/about"
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${pathname === "/about"
                            ? "bg-teal-50 text-teal-700"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                            }`}
                    >
                        <Info className="w-3.5 h-3.5" />
                        About
                    </Link>
                </nav>
            </div>

            {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
        </header>
    );
}
