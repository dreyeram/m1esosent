"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Loader2, AlertCircle, Check, ClipboardCheck, User, Calendar, Phone, Mail, MapPin, Stethoscope, FileText } from "lucide-react";
import { createPatient, updatePatient, checkMobileExists } from "@/app/actions/auth";
import { encodeProcedureType } from "@/types/procedureTypes";

import { resolveImageUrl } from "@/lib/utils/image";
import { cn } from "@/lib/utils";
interface NewPatientFormProps {
    onSuccess: (patient: any, procedureType?: string) => void;
    editingPatient?: any;
    orgLogo?: string;
    onCancel?: () => void;
    orgName?: string; // Added orgName to props
}

const GENDER_OPTIONS = ["Male", "Female", "Other"];

export default function NewPatientForm({ onSuccess, editingPatient, orgLogo, onCancel, orgName = "Org" }: NewPatientFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [logoError, setLogoError] = useState(false); // Added logoError state
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        fullName: editingPatient?.fullName || '',
        age: editingPatient?.age?.toString() || '',
        gender: editingPatient?.gender || 'Male',
        mobile: editingPatient?.mobile || '',
        email: editingPatient?.email || '',
        address: editingPatient?.address || '',
        referringDoctor: editingPatient?.referringDoctor || '',
        refId: editingPatient?.refId || '',
        notes: editingPatient?.notes || ''
    });

    const [mobileStatus, setMobileStatus] = useState<'idle' | 'checking' | 'exists' | 'available'>('idle');
    const [mobileCheckMessage, setMobileCheckMessage] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'fullName' && value !== '' && !/^[a-zA-Z\s]+$/.test(value)) {
            return;
        }

        if (name === 'age' && value !== '') {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 0 || num > 150) {
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');

        if (name === 'mobile') {
            setMobileStatus('idle');
            setMobileCheckMessage('');
        }
    };

    React.useEffect(() => {
        if (!formData.mobile || formData.mobile.length < 10) {
            setMobileStatus('idle');
            setMobileCheckMessage('');
            return;
        }

        const checkMobile = async () => {
            setMobileStatus('checking');
            const result = await checkMobileExists(formData.mobile);
            if (result.exists) {
                setMobileStatus('exists');
                setMobileCheckMessage(`A PATIENT WITH THE MOBILE NUMBER ${formData.mobile} ALREADY EXISTS.`);
            } else {
                setMobileStatus('available');
            }
        };

        const timer = setTimeout(() => {
            checkMobile();
        }, 800);

        return () => clearTimeout(timer);
    }, [formData.mobile]);

    const validate = () => {
        const name = formData.fullName.trim();
        if (!name) return "Patient name is required";
        if (name.length < 4) return "Name must be at least 4 characters";
        if (!/^[a-zA-Z\s]+$/.test(name)) return "Name can only contain letters, spaces";

        const ageNum = parseInt(formData.age);
        if (!formData.age || isNaN(ageNum)) return "Valid age required";
        if (ageNum < 0) return "Age cannot be negative";
        if (ageNum > 150) return "Age must be realistic";

        if (!formData.mobile.trim() || formData.mobile.length < 10) return "Valid mobile number required";
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Valid email address required";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (mobileStatus === 'exists') {
            setError(mobileCheckMessage || 'Mobile number already exists.');
            return;
        }

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            if (editingPatient) {
                const result = await updatePatient(editingPatient.id, {
                    fullName: formData.fullName.trim(),
                    age: parseInt(formData.age) || 0,
                    gender: formData.gender as any,
                    mobile: formData.mobile.trim(),
                    email: formData.email.trim() || undefined,
                    address: formData.address.trim() || undefined,
                    referringDoctor: formData.referringDoctor.trim() || undefined,
                    refId: formData.refId.trim() || undefined,
                });

                if (result.success && result.patient) {
                    onSuccess(result.patient);
                } else {
                    setError(result.error || 'Failed to update record');
                }
            } else {
                const result = await createPatient({
                    fullName: formData.fullName.trim(),
                    age: parseInt(formData.age) || 0,
                    gender: formData.gender as any,
                    mobile: formData.mobile.trim(),
                    email: formData.email.trim() || undefined,
                    address: formData.address.trim() || undefined,
                    referringDoctor: formData.referringDoctor.trim() || undefined,
                    refId: formData.refId.trim() || undefined,
                });

                if (result.success && result.patient) {
                    const defaultType = encodeProcedureType("1", "1", "1");
                    onSuccess(result.patient, defaultType);
                    setFormData({ fullName: '', age: '', gender: 'Male', mobile: '', email: '', address: '', referringDoctor: '', refId: '', notes: '' });
                } else {
                    setError(result.error || 'Conflict in record database');
                }
            }
        } catch (err) {
            setError('Registry bridge failure');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent overflow-hidden py-1">
            <div className="flex-1 bg-white border border-slate-200 rounded-[24px] shadow-sm flex flex-col overflow-hidden relative mx-1 mb-1">

                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                            <UserPlus size={18} />
                        </div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                            {editingPatient ? 'Update Patient' : 'Register New Patient'}
                        </h2>
                    </div>
                    <div className="flex items-center mr-2 shrink-0">
                        {orgLogo && !logoError ? (
                            <img
                                src={resolveImageUrl(orgLogo)!}
                                alt="Org Logo"
                                className="h-8 w-auto max-w-[110px] object-contain"
                                onError={() => setLogoError(true)}
                            />
                        ) : (
                            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center text-white font-serif font-bold text-sm shadow-md uppercase">
                                {orgName.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    <div className="space-y-4">

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-y-3">
                                {/* Full Name */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">Full Name <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="Legal Name"
                                        className={cn(
                                            "w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none",
                                            error && !formData.fullName.trim() ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        )}
                                    />
                                </div>

                                {/* Age */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">Age <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="age"
                                            value={formData.age}
                                            onChange={handleChange}
                                            placeholder="Yrs"
                                            min="0"
                                            max="150"
                                            className={cn(
                                                "w-full h-9 pl-3 pr-8 bg-white border rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none",
                                                error && (!formData.age || parseInt(formData.age) <= 0) ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            )}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-medium pointer-events-none">Age</span>
                                    </div>
                                </div>

                                {/* Gender */}
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">Gender <span className="text-red-500">*</span></label>
                                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 h-9">
                                        {GENDER_OPTIONS.map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, gender: g }))}
                                                className={cn(
                                                    "flex-1 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all",
                                                    formData.gender === g
                                                        ? 'bg-white text-blue-700 shadow-sm border border-slate-200/50'
                                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                                )}
                                            >
                                                {g}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1 relative">
                                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">Mobile Number <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            name="mobile"
                                            value={formData.mobile}
                                            onChange={handleChange}
                                            placeholder="10-digit number"
                                            maxLength={10}
                                            className={cn(
                                                "w-full h-9 px-3 pr-10 bg-white border rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none",
                                                error && (!formData.mobile.trim() || formData.mobile.length < 10) ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500" :
                                                    mobileStatus === 'exists' ? "border-red-400 focus:border-red-500 ring-1 ring-red-500" :
                                                        mobileStatus === 'available' ? "border-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" :
                                                            "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            )}
                                        />
                                        {mobileStatus === 'checking' && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                                        )}
                                    </div>
                                    {mobileStatus === 'exists' && (
                                        <div className="bg-red-50 border border-red-100 rounded-lg p-2 mt-2 flex items-center justify-between">
                                            <div className="flex flex-col gap-0.5 max-w-[85%]">
                                                <p className="text-[10px] text-red-600 font-bold uppercase truncate leading-tight">PATIENT CREATION FAILED:</p>
                                                <p className="text-[10px] text-red-600 font-bold uppercase truncate leading-tight">THE MOBILE NUMBER {formData.mobile} ALREADY EXISTS.</p>
                                            </div>
                                            <AlertCircle className="text-red-500 w-4 h-4 shrink-0" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Optional"
                                        className={cn(
                                            "w-full h-9 px-3 bg-white border rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 transition-all outline-none",
                                            error && formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? "border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500" : "border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">Residential Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="City / Area"
                                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">Referring Physician</label>
                                    <input
                                        type="text"
                                        name="referringDoctor"
                                        value={formData.referringDoctor}
                                        onChange={handleChange}
                                        placeholder="Dr. Name"
                                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-semibold text-slate-600 uppercase tracking-tight">Ref ID (OH)</label>
                                    <input
                                        type="text"
                                        name="refId"
                                        value={formData.refId}
                                        onChange={handleChange}
                                        placeholder="Ref ID"
                                        className="w-full h-8 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full h-10 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg shadow-slate-900/10 hover:bg-slate-800 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-white/70" />
                                ) : (
                                    <>
                                        {editingPatient ? 'Update Patient' : 'Register Patient'} <Check size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Error Notification */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-16 left-4 right-4 bg-rose-50 border border-rose-100 text-rose-600 px-3 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2"
                        >
                            <AlertCircle size={14} className="shrink-0" />
                            <p className="text-[10px] font-bold uppercase tracking-wide flex-1">{error}</p>
                            <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-md transition-colors">
                                <Check size={12} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div >
        </div >
    );
}
