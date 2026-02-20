import { Metadata } from "next";
import Link from "next/link";
import {
    Cpu,
    Layers,
    Zap,
    ScanLine,
    Globe,
    GitBranch,
    ChevronRight,
    BarChart2,
    Sliders,
    Download,
} from "lucide-react";
import Header from "@/components/Header";

export const metadata: Metadata = {
    title: "About | Edge Dent Seg Clinical Suite",
    description:
        "Learn about Edge Dent Seg — a browser-native dental X-ray segmentation tool powered by YOLO11 and ONNX Runtime Web.",
};

const NAV_SECTIONS = [
    { id: "overview", label: "Overview" },
    { id: "features", label: "Features" },
    { id: "tech", label: "Technology" },
    { id: "usage", label: "How to Use" },
    { id: "author", label: "Author" },
];

const FEATURES = [
    {
        icon: ScanLine,
        title: "Real-time Segmentation",
        desc: "Instance segmentation of dental conditions on panoramic X-rays with pixel-level accuracy using YOLO11-Seg.",
        color: "teal",
    },
    {
        icon: Cpu,
        title: "On-Device Inference",
        desc: "All computation runs directly in your browser. Your X-rays never leave your device — fully private.",
        color: "purple",
    },
    {
        icon: Zap,
        title: "Hardware Acceleration",
        desc: "Switch between WebGPU (GPU) and WASM (CPU) backends for optimal performance on any hardware.",
        color: "amber",
    },
    {
        icon: Layers,
        title: "Multiple Models",
        desc: "Choose from several YOLO11-Seg model sizes (n, s, m, l) or load your own custom .onnx model.",
        color: "blue",
    },
    {
        icon: BarChart2,
        title: "Detection Analytics",
        desc: "Detailed detection table with class names, confidence scores, colour-coded identity dots, and warmup/inference timing.",
        color: "rose",
    },
    {
        icon: Sliders,
        title: "Interactive Filtering",
        desc: "Click any detection row to isolate it on the overlay. Click again to deselect and restore all annotations.",
        color: "indigo",
    },
    {
        icon: Download,
        title: "Export Results",
        desc: "Save the annotated image as a PNG with all segmentation masks and bounding boxes composited.",
        color: "emerald",
    },
    {
        icon: Globe,
        title: "Live Camera Support",
        desc: "Attach an intraoral camera or use your webcam for continuous real-time inference frame-by-frame.",
        color: "orange",
    },
];

const colorMap: Record<string, string> = {
    teal: "bg-teal-50 text-teal-600 border-teal-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
};

const TECH_STACK = [
    { name: "YOLO11-Seg", role: "Segmentation Model", href: "https://docs.ultralytics.com/models/yolo11/" },
    { name: "ONNX Runtime Web", role: "Browser Inference Engine", href: "https://onnxruntime.ai/" },
    { name: "WebGPU / WebNN / WASM", role: "Hardware Backends", href: "https://www.w3.org/TR/webgpu/" },
    { name: "OpenCV.js", role: "Image Pre/Post-processing", href: "https://docs.opencv.org/4.x/d5/d10/tutorial_js_root.html" },
    { name: "Next.js 15", role: "React Framework", href: "https://nextjs.org/" },
    { name: "Tailwind CSS", role: "Styling", href: "https://tailwindcss.com/" },
    { name: "shadcn/ui", role: "Component Library", href: "https://ui.shadcn.com/" },
];

const STEPS = [
    {
        step: "01",
        title: "Load a Model",
        desc: "Click the ⚙ Settings icon. Select a model size and inference backend. The model downloads and warms up automatically.",
    },
    {
        step: "02",
        title: "Choose Input",
        desc: "Upload a panoramic X-ray image, open your webcam/intraoral camera, or click one of the example images to get started instantly.",
    },
    {
        step: "03",
        title: "Analyse Results",
        desc: "Segmentation masks and bounding boxes appear on the image immediately. The sidebar lists all detected classes with confidence scores.",
    },
    {
        step: "04",
        title: "Filter & Export",
        desc: "Click any detection row to isolate it. When satisfied, hit Save to download the annotated PNG.",
    },
];

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
            <Header />

            {/* Sticky section TOC */}
            <div className="sticky top-[65px] z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
                <div className="max-w-5xl mx-auto px-6 overflow-x-auto">
                    <nav className="flex items-center gap-1 py-2">
                        {NAV_SECTIONS.map((s) => (
                            <a
                                key={s.id}
                                href={`#${s.id}`}
                                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                            >
                                {s.label}
                            </a>
                        ))}
                    </nav>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">

                {/* ── HERO / OVERVIEW ─────────────────────────────────────── */}
                <section id="overview" className="scroll-mt-28">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full border border-teal-100 mb-4">
                                Clinical AI Tool
                            </span>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-4">
                                Edge Dent Seg
                                <br />
                                <span className="text-teal-600">Clinical Suite</span>
                            </h1>
                            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
                                A browser-native dental X-ray segmentation application powered by YOLO11 and ONNX
                                Runtime Web. It performs <strong>instance segmentation</strong> of clinically relevant
                                dental structures — entirely on-device, with no server uploads.
                            </p>
                            <div className="flex flex-wrap gap-3 mt-6">
                                <Link
                                    href="/"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Open Workspace <ChevronRight className="w-4 h-4" />
                                </Link>
                                <a
                                    href="https://github.com/pranta-barua007"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                                >
                                    <GitBranch className="w-4 h-4" />
                                    GitHub
                                </a>
                            </div>
                        </div>

                        {/* Stats card */}
                        <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full md:w-auto">
                            {[
                                { val: "2", label: "Model Variants" },
                                { val: "2", label: "Hardware Backends" },
                                { val: "0", label: "Server Uploads" },
                                { val: "100%", label: "Private" },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4 text-center"
                                >
                                    <div className="text-3xl font-extrabold text-teal-600">{s.val}</div>
                                    <div className="text-xs text-slate-500 font-medium mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── FEATURES ────────────────────────────────────────────── */}
                <section id="features" className="scroll-mt-28">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Features</h2>
                        <p className="text-slate-500">Everything you need for in-browser dental X-ray analysis.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FEATURES.map((f) => (
                            <div
                                key={f.title}
                                className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-slate-200 transition-all"
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colorMap[f.color]}`}>
                                    <f.icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-slate-800 text-sm">{f.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── TECHNOLOGY ──────────────────────────────────────────── */}
                <section id="tech" className="scroll-mt-28">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Technology Stack</h2>
                        <p className="text-slate-500">Built on modern, open web standards.</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                        {TECH_STACK.map((t) => (
                            <a
                                key={t.name}
                                href={t.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 group transition-colors"
                            >
                                <div>
                                    <div className="font-semibold text-slate-800 text-sm group-hover:text-teal-700 transition-colors">{t.name}</div>
                                    <div className="text-xs text-slate-500">{t.role}</div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                            </a>
                        ))}
                    </div>
                </section>

                {/* ── HOW TO USE ──────────────────────────────────────────── */}
                <section id="usage" className="scroll-mt-28">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">How to Use</h2>
                        <p className="text-slate-500">Get started in four simple steps.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {STEPS.map((s) => (
                            <div key={s.step} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3">
                                <span className="text-3xl font-black text-teal-100 select-none">{s.step}</span>
                                <h3 className="font-bold text-slate-800">{s.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── AUTHOR ──────────────────────────────────────────────── */}
                <section id="author" className="scroll-mt-28">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Author</h2>
                        <p className="text-slate-500">The person behind the project.</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 max-w-lg">
                        <img
                            src="https://github.com/pranta-barua007.png"
                            alt="pranta-barua007"
                            className="w-20 h-20 rounded-full border-2 border-teal-100 object-cover flex-shrink-0"
                        />
                        <div className="text-center sm:text-left">
                            <h3 className="text-xl font-bold text-slate-800">Pranta Barua</h3>
                            <p className="text-sm text-slate-500 mb-3">pranta-barua007</p>
                            <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                Full-stack developer passionate about bringing AI to the browser edge. Built Edge Dent Seg to make dental AI accessible without server infrastructure.
                            </p>
                            <a
                                href="https://github.com/pranta-barua007"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-colors"
                            >
                                <GitBranch className="w-4 h-4" />
                                View on GitHub
                            </a>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="border-t border-slate-100 bg-white mt-8">
                <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-teal-600 rounded flex items-center justify-center text-white font-bold text-xs">D</div>
                        <span>Edge Dent Seg Clinical Suite</span>
                    </div>
                    <span>Built with Next.js · ONNX Runtime Web · YOLO11</span>
                </div>
            </footer>
        </div>
    );
}
