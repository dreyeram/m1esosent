import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Users,
    Plus,
    FileText,
    Settings,
    Activity,
    CreditCard,
    LayoutGrid
} from 'lucide-react';

export type TabType = 'schedule' | 'patients' | 'new-patient' | 'patient-detail' | 'procedure' | 'report' | 'settings';

export interface Tab {
    id: string;
    type: TabType;
    label: string;
    icon: React.ReactNode;
    closable: boolean;
    data?: any;
}

export function useTabManager() {
    // Initial tabs: Schedule (Pinned), Patients (Pinned)
    const [tabs, setTabs] = useState<Tab[]>([
        {
            id: 'schedule',
            type: 'schedule',
            label: 'Schedule',
            icon: React.createElement(LayoutGrid, { size: 16, strokeWidth: 2.5 }),
            closable: false
        },
        {
            id: 'patients',
            type: 'patients',
            label: 'Patients',
            icon: React.createElement(Users, { size: 16, strokeWidth: 2.5 }),
            closable: false
        }
    ]);
    const [activeTabId, setActiveTabId] = useState<string>('schedule');

    // Persist tabs (simplified for demo)
    useEffect(() => {
        const saved = localStorage.getItem('loyalmed_tabs');
        if (saved) {
            try {
                // Restore tabs but ensure icons are re-attached (since they don't serialize)
                const parsed = JSON.parse(saved);
                const restored = parsed.map((t: any) => ({
                    ...t,
                    icon: getIconForType(t.type)
                }));
                // Ensure pinned tabs exist
                if (!restored.find((t: any) => t.id === 'schedule')) {
                    restored.unshift({ id: 'schedule', type: 'schedule', label: 'Schedule', icon: React.createElement(LayoutGrid, { size: 16 }), closable: false });
                }
                setTabs(restored);
            } catch (e) {
                console.error("Failed to restore tabs", e);
            }
        }

        const savedActive = localStorage.getItem('loyalmed_active_tab');
        if (savedActive) setActiveTabId(savedActive);
    }, []);

    useEffect(() => {
        // Save tabs without icons (circular structure)
        const toSave = tabs.map(({ icon, ...rest }) => rest);
        localStorage.setItem('loyalmed_tabs', JSON.stringify(toSave));
        localStorage.setItem('loyalmed_active_tab', activeTabId);
    }, [tabs, activeTabId]);

    const getIconForType = (type: TabType) => {
        switch (type) {
            case 'schedule': return React.createElement(LayoutGrid, { size: 16, strokeWidth: 2.5 });
            case 'patients': return React.createElement(Users, { size: 16, strokeWidth: 2.5 });
            case 'new-patient': return React.createElement(Plus, { size: 16, strokeWidth: 3 });
            case 'patient-detail': return React.createElement(Activity, { size: 16, strokeWidth: 2.5 });
            case 'procedure': return React.createElement(Activity, { size: 16, strokeWidth: 2.5, className: "text-rose-500" });
            case 'report': return React.createElement(FileText, { size: 16, strokeWidth: 2.5 });
            case 'settings': return React.createElement(Settings, { size: 16, strokeWidth: 2.5 });
            default: return React.createElement(Activity, { size: 16 });
        }
    };

    const openTab = (type: TabType, data?: any, labelOverride?: string) => {
        let newTabId: string = type;
        let newLabel = labelOverride || (type.charAt(0).toUpperCase() + type.slice(1));

        if (type === 'patient-detail' && data?.id) {
            newTabId = `patient-${data.id}`;
        } else if (type === 'new-patient') {
            newTabId = 'new-patient';
            newLabel = 'New Patient';
        }

        const existing = tabs.find(t => t.id === newTabId);
        if (existing) {
            setActiveTabId(newTabId);
            return;
        }

        const newTab: Tab = {
            id: newTabId,
            type,
            label: newLabel,
            icon: getIconForType(type),
            closable: type !== 'schedule' && type !== 'patients',
            data
        };

        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newTabId);
    };

    const closeTab = (id: string) => {
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);

        if (activeTabId === id) {
            const index = tabs.findIndex(t => t.id === id);
            const nextTab = newTabs[index - 1] || newTabs[index] || newTabs[0];
            setActiveTabId(nextTab.id);
        }
    };

    return {
        tabs,
        activeTabId,
        setActiveTabId,
        closeTab,
        openSchedule: () => setActiveTabId('schedule'),
        openPatients: () => setActiveTabId('patients'),
        openNewPatient: () => openTab('new-patient'),
        openPatientDetail: (id: string, name: string) => openTab('patient-detail', { id }, name),
        openSettings: () => openTab('settings'),
        activeTab: tabs.find(t => t.id === activeTabId)
    };
}
