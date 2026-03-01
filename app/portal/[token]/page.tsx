import { verifyShareToken } from "@/app/actions/communication";
import { AlertTriangle, Calendar, FileText, Shield, User } from "lucide-react";
import { PrintButton, PrintStyles } from "./PortalClient";

interface PortalPageProps {
    params: Promise<{ token: string }>;
}

export default async function PortalPage({ params }: PortalPageProps) {
    const { token } = await params;
    const result = await verifyShareToken(token);

    // Error states
    if (!result.success) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {result.code === "EXPIRED" ? "Link Expired" :
                            result.code === "DEACTIVATED" ? "Link Deactivated" :
                                "Invalid Link"}
                    </h1>
                    <p className="text-slate-400 mb-6">
                        {result.error || "This link is no longer valid."}
                    </p>
                    <p className="text-sm text-slate-500">
                        Please contact your healthcare provider for a new link.
                    </p>
                </div>
            </div>
        );
    }

    // Parse report content
    let reportData: any = {};
    try {
        reportData = JSON.parse(result.data?.reportContent || "{}");
    } catch (e) {
        reportData = {};
    }

    return (
        <div className="min-h-screen bg-slate-950">
            {/* Security Header */}
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 py-3 px-4 no-print">
                <div className="max-w-4xl mx-auto flex items-center gap-2 text-emerald-400 text-sm">
                    <Shield className="w-4 h-4" />
                    <span>Secure Medical Document • View #{result.data?.viewCount}</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6">
                {/* Patient Info Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">
                                Medical Report
                            </h1>
                            <p className="text-slate-400">
                                {result.data?.procedureType?.toUpperCase().replace(/_/g, ' ')}
                            </p>
                        </div>
                        <PrintButton />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <div className="flex items-center gap-3 text-slate-300">
                            <User className="w-5 h-5 text-slate-500" />
                            <div>
                                <div className="text-xs text-slate-500">Patient</div>
                                <div className="font-medium">{result.data?.patientName}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <Calendar className="w-5 h-5 text-slate-500" />
                            <div>
                                <div className="text-xs text-slate-500">Date</div>
                                <div className="font-medium">
                                    {new Date(result.data?.procedureDate || "").toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-slate-300">
                            <FileText className="w-5 h-5 text-slate-500" />
                            <div>
                                <div className="text-xs text-slate-500">Physician</div>
                                <div className="font-medium">{result.data?.doctorName}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Content */}
                <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-lg no-shadow">
                    <h2 className="text-xl font-bold mb-6 border-b border-slate-200 pb-4">
                        Procedure Findings
                    </h2>

                    {reportData.findings && reportData.findings.length > 0 ? (
                        <div className="space-y-6">
                            {reportData.findings.map((finding: any, index: number) => (
                                <div key={index} className="border-l-4 border-emerald-500 pl-4 py-2">
                                    <h3 className="font-semibold text-lg mb-1">
                                        {finding.site || `Finding ${index + 1}`}
                                    </h3>
                                    <p className="text-slate-600">
                                        {finding.description || finding.finding || "No details available"}
                                    </p>
                                    {finding.impression && (
                                        <p className="text-sm text-slate-500 mt-2">
                                            <strong>Impression:</strong> {finding.impression}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-slate-500 text-center py-8">
                            Report content is being prepared. Please check back later.
                        </div>
                    )}

                    {reportData.conclusion && (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <h3 className="font-semibold mb-2">Conclusion</h3>
                            <p className="text-slate-600">{reportData.conclusion}</p>
                        </div>
                    )}

                    {reportData.recommendations && (
                        <div className="mt-6">
                            <h3 className="font-semibold mb-2">Recommendations</h3>
                            <p className="text-slate-600">{reportData.recommendations}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center text-slate-500 text-sm mt-8 no-print">
                    <p>This is a secure medical document. Do not share with unauthorized individuals.</p>
                </div>
            </div>

            <PrintStyles />
        </div>
    );
}
