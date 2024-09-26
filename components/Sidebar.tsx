// components/Sidebar.tsx
"use client"

import { LayoutDashboard, Key, Wrench, Settings, Factory, FileCheck, FileText, ShieldCheck, CreditCard, FileSignature, Users, FileSpreadsheet, ClipboardCheck, DollarSign, BarChart2, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard", category: "Main", available: true },

    // One-off Tools
    { href: "/password-checker", icon: Key, label: "Password Checker", category: "One-off Tools", available: true },
    { href: "/manufacturers-details", icon: Factory, label: "Manufacturers Details", category: "One-off Tools", available: true },
    { href: "/withholding-tax-doc-extractor", icon: FileText, label: "Withholding Tax Doc Extractor", category: "One-off Tools", available: true },
    { href: "/tax-compliance-downloader", icon: ShieldCheck, label: "Tax Compliance Downloader", category: "One-off Tools", available: true },
    { href: "/password-changer", icon: Key, label: "Password Changer", category: "One-off Tools", available: true },
    { href: "/pin-profile-extractor", icon: ClipboardCheck, label: "PIN Profile Extractor", category: "One-off Tools", available: true },

    // Monthly Tools
    { href: "/withholding-tax-downloader", icon: Download, label: "Withholding Tax Downloader", category: "Monthly Tools", available: true },
    { href: "/auto-population-downloader", icon: Users, label: "Auto Population Downloader", category: "Monthly Tools", available: true },
    { href: "/liabilities-extractor", icon: FileSpreadsheet, label: "Liabilities Extractor", category: "Monthly Tools", available: true },
    { href: "/withholding-vat-extractor", icon: DollarSign, label: "Withholding VAT Extractor", category: "Monthly Tools", available: true },
    { href: "/ledger-downloader", icon: BarChart2, label: "Ledger Downloader", category: "Monthly Tools", available: true },

    // Suggested New Tools
    { href: "/pin-registration", icon: FileSignature, label: "PIN Registration Tool", category: "Suggested New Tools", available: false },
    { href: "/tax-returns-filing", icon: FileCheck, label: "Tax Returns Filing", category: "Suggested New Tools", available: false },
    { href: "/tax-certificates", icon: FileText, label: "Tax Compliance Certificates", category: "Suggested New Tools", available: false },
    { href: "/tax-clearance", icon: ShieldCheck, label: "Tax Clearance Status Checker", category: "Suggested New Tools", available: false },
    { href: "/payment-reminders", icon: CreditCard, label: "Tax Payment Reminders", category: "Suggested New Tools", available: false },
    { href: "/audit-logs", icon: FileText, label: "Audit Logs Viewer", category: "Suggested New Tools", available: false },
    
    { href: "/settings", icon: Settings, label: "Settings", category: "Main", available: true },
];

export function Sidebar() {
    const pathname = usePathname()
    const [isExpanded, setIsExpanded] = useState(true)

    const categories = Array.from(new Set(navItems.map(item => item.category)));

    return (
        <div className="flex h-[150vh]">
            <aside className={`bg-gray-800 text-white transition-all duration-300 ease-in-out ${isExpanded ? 'w-[300px]' : 'w-20'} p-3 hidden md:block relative`}>
                <div className={`flex items-center mb-6 ${isExpanded ? '' : 'justify-center'}`}>
                    {isExpanded && <span className="text-lg font-bold">KRA Tools</span>}
                </div>
                <nav className="space-y-1">
                    {categories.map((category) => (
                        <div key={category}>
                            {isExpanded && <h3 className="text-xs font-semibold text-gray-400 mt-3 mb-1">{category}</h3>}
                            {navItems.filter(item => item.category === category).map((item) => (
                                item.available ? (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center p-1.5 rounded text-sm ${pathname === item.href
                                                ? "text-blue-400 font-bold bg-gray-700"
                                                : "text-gray-300 hover:bg-gray-700"
                                            } ${isExpanded ? '' : 'justify-center'} relative`}
                                    >
                                        <item.icon className="w-4 h-4 mr-2" />
                                        {isExpanded && item.label}
                                    </Link>
                                ) : (
                                    <Popover key={item.href}>
                                        <PopoverTrigger asChild>
                                            <button
                                                className={`flex items-center p-1.5 rounded text-sm text-gray-400 hover:bg-gray-700 ${isExpanded ? '' : 'justify-center'} relative w-full text-left`}
                                            >
                                                <span className="absolute top-0 right-0 w-2 h-2 z-10 bg-red-500 rounded-full"></span>
                                                <item.icon className="w-4 h-4 mr-2" />
                                                {isExpanded && item.label}
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="bg-red-500 text-white p-1 text-xs rounded w-40 h-8">
                                            Coming soon
                                        </PopoverContent>
                                    </Popover>
                                )
                            ))}
                        </div>
                    ))}
                </nav>
                <button
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-gray-700 hover:bg-gray-600 text-white"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
            </aside>
        </div>
    );
}