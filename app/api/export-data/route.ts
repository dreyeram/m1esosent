import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Fetch all patients with their procedures and reports
        const patients = await prisma.patient.findMany({
            where: {
                deletedAt: null
            },
            include: {
                procedures: {
                    include: {
                        report: true,
                        doctor: {
                            select: {
                                id: true,
                                fullName: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Fetch organization settings
        const organizations = await prisma.organization.findMany({
            select: {
                id: true,
                name: true,
                type: true,
                letterheadConfig: true,
            }
        });

        // Fetch schedule settings
        const scheduleSettings = await prisma.scheduleSettings.findMany();

        // Build export data structure
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: "1.0",
            patients: patients.map(p => {
                // Parse contactInfo JSON if present
                let contactData: { mobile?: string; email?: string; address?: string } = {};
                if (p.contactInfo) {
                    try {
                        contactData = JSON.parse(p.contactInfo);
                    } catch (e) { }
                }

                return {
                    id: p.id,
                    fullName: p.fullName,
                    mrn: p.mrn,
                    mobile: contactData.mobile || '',
                    email: contactData.email || '',
                    gender: p.gender,
                    dateOfBirth: p.dateOfBirth?.toISOString(),
                    address: contactData.address || '',
                    createdAt: p.createdAt.toISOString(),
                    procedures: p.procedures.map(proc => ({
                        id: proc.id,
                        type: proc.type,
                        status: proc.status,
                        scheduledDate: proc.scheduledDate?.toISOString(),
                        scheduledTime: proc.scheduledTime,
                        startTime: proc.startTime?.toISOString(),
                        endTime: proc.endTime?.toISOString(),
                        doctor: proc.doctor?.fullName,
                        report: proc.report ? {
                            id: proc.report.id,
                            content: proc.report.content,
                            createdAt: proc.report.createdAt.toISOString(),
                        } : null,
                    })),
                };
            }),
            organizations,
            scheduleSettings: scheduleSettings.map(s => ({
                id: s.id,
                organizationId: s.organizationId,
                dayStartTime: s.dayStartTime,
                dayEndTime: s.dayEndTime,
                lunchBreakEnabled: s.lunchBreakEnabled,
                slotDurationMinutes: s.slotDurationMinutes,
                workingDays: s.workingDays,
            })),
            stats: {
                totalPatients: patients.length,
                totalProcedures: patients.reduce((acc, p) => acc + p.procedures.length, 0),
                totalReports: patients.reduce((acc, p) =>
                    acc + p.procedures.filter(proc => proc.report).length, 0
                ),
            }
        };

        return NextResponse.json(exportData);
    } catch (error) {
        console.error("Export data error:", error);
        return NextResponse.json(
            { error: "Failed to export data" },
            { status: 500 }
        );
    }
}
