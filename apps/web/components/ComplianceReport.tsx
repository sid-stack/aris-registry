import { ShieldCheck, AlertTriangle, XCircle } from "lucide-react";

interface ComplianceReportProps {
    score: string;
    status: "RED" | "YELLOW" | "GREEN";
    findings: string;
}

export function ComplianceReport({ score, status, findings }: ComplianceReportProps) {
    const getStatusConfig = () => {
        switch (status) {
            case "GREEN":
                return {
                    color: "text-green-500",
                    bgColor: "bg-green-500/10",
                    borderColor: "border-green-500/20",
                    icon: ShieldCheck,
                    label: "Compliant",
                };
            case "YELLOW":
                return {
                    color: "text-yellow-500",
                    bgColor: "bg-yellow-500/10",
                    borderColor: "border-yellow-500/20",
                    icon: AlertTriangle,
                    label: "Warnings Found",
                };
            case "RED":
                return {
                    color: "text-red-500",
                    bgColor: "bg-red-500/10",
                    borderColor: "border-red-500/20",
                    icon: XCircle,
                    label: "Non-Compliant",
                };
            default:
                return {
                    color: "text-gray-500",
                    bgColor: "bg-gray-500/10",
                    borderColor: "border-gray-500/20",
                    icon: ShieldCheck,
                    label: "Unknown",
                };
        }
    };

    const config = getStatusConfig();
    const Icon = config.icon;

    return (
        <div className={`p-6 rounded-xl border ${config.borderColor} ${config.bgColor} backdrop-blur-sm transition-all`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                        <Icon className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className={`font-semibold ${config.color} text-lg`}>{config.label}</h3>
                        <p className="text-sm text-muted-foreground opacity-80">Automated Compliance Check</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className={`text-2xl font-bold ${config.color}`}>{score}</div>
                    <div className="text-xs text-muted-foreground">Match Score</div>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200/10">
                <h4 className="text-sm font-medium mb-2 opacity-90">Findings Summary</h4>
                <p className="text-sm leading-relaxed opacity-80 whitespace-pre-wrap">
                    {findings || "No specific findings recorded."}
                </p>
            </div>
        </div>
    );
}
