import React, { useState } from 'react';
import { Copy, Download, CheckCircle2 } from 'lucide-react';

interface ComplianceItem {
    section: string;
    requirement: string;
    description: string;
}

interface ComplianceMatrixProps {
    items: ComplianceItem[];
}

export default function ComplianceMatrix({ items }: ComplianceMatrixProps) {
    const [copied, setCopied] = useState(false);

    if (!items || items.length === 0) {
        return null;
    }

    const handleCopy = () => {
        const text = items.map(i => `[${i.section}] ${i.requirement}\n${i.description}`).join('\n\n');
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportCSV = () => {
        const headers = ['Section', 'Requirement', 'Description'];
        const csvContent = [
            headers.join(','),
            ...items.map(i => [
                `"${i.section.replace(/"/g, '""')}"`,
                `"${i.requirement.replace(/"/g, '""')}"`,
                `"${i.description.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'compliance_matrix.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden mt-8">
            <div className="flex items-center justify-between p-4 md:px-6 border-b border-zinc-800 bg-zinc-900/80">
                <div>
                    <h3 className="text-lg font-semibold text-white">Compliance Matrix</h3>
                    <p className="text-sm text-zinc-400">Extracted from Section L & M</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700 hover:border-zinc-600"
                    >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20 hover:border-emerald-500/30"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="bg-black/40 text-xs uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                            <th className="px-4 md:px-6 py-3 font-medium w-1/5">Section</th>
                            <th className="px-4 md:px-6 py-3 font-medium w-1/4">Requirement</th>
                            <th className="px-4 md:px-6 py-3 font-medium">Description</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                        {items.map((item, index) => (
                            <tr key={index} className="hover:bg-zinc-800/30 transition-colors group">
                                <td className="px-4 md:px-6 py-4 text-sm font-medium text-emerald-400 align-top">
                                    {item.section}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-sm text-white font-medium align-top">
                                    {item.requirement}
                                </td>
                                <td className="px-4 md:px-6 py-4 text-sm text-zinc-400 align-top leading-relaxed">
                                    {item.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
