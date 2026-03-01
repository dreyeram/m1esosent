"use client";

import React, { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { Activity, Users, DollarSign } from "lucide-react";
import AdminDashboard from "@/components/admin/AdminDashboard";
import UserManagement from "@/components/admin/UserManagement";
import DataSecurity from "@/components/admin/DataSecurity";
import SettingsPanel from "@/components/panels/SettingsPanel";
import InventoryManagement from "@/components/admin/InventoryManagement";
import CommunicationPanel from "@/components/admin/CommunicationPanel";
import { getSeededAdminId } from "@/app/actions/auth";
import { getUserProfile } from "@/app/actions/settings";
import EquipmentSettings from "@/components/settings/EquipmentSettings";
import { useEffect } from "react";

export default function AdminPage() {
    const [view, setView] = useState('dashboard');
    const [userData, setUserData] = useState<any>(null);
    const [orgData, setOrgData] = useState<any>(null);

    const loadData = React.useCallback(async () => {
        try {
            const adminId = await getSeededAdminId();
            if (adminId) {
                const userResult = await getUserProfile(adminId);
                if (userResult.success && userResult.user) {
                    setUserData(userResult.user);
                    setOrgData(userResult.user.organization);
                }
            }
        } catch (error) {
            console.error("Failed to load admin settings data:", error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // In a real app, these would come from Session/Context
    const adminUser = "Administrator";

    return (
        <DashboardShell
            role="ADMIN"
            userName={adminUser}
            organizationName={orgData?.name}
            logoPath={orgData?.logoPath}
            currentView={view}
            onViewChange={setView}
            onLogout={() => window.location.href = '/login'}
        >

            {view === 'dashboard' && (
                <AdminDashboard
                    user={userData}
                    organization={orgData}
                    onUpdate={loadData}
                />
            )}
            {view === 'users' && <UserManagement />}
            {view === 'data' && <DataSecurity />}
            {view === 'communication' && <CommunicationPanel />}
            {view === 'inventory' && orgData && (
                <InventoryManagement organizationId={orgData.id} />
            )}

            {view === 'equipment' && (
                <div className="h-[calc(100vh-64px)]">
                    <EquipmentSettings />
                </div>
            )}

        </DashboardShell>
    );
}
