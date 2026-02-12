import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import {
    QrCode,
    LogOut,
    Camera,
    X,
    BookOpen,
    User,
    CheckCircle,
    Shield,
    Globe,
    LayoutGrid,
    GraduationCap,
    ClipboardList,
    Play,
    Settings,
    ChevronRight,
    Clock,
    FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';

const UserDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'academy' | 'scan' | 'log' | 'account'

    // Mock Data for UI
    const userData = {
        name: user?.user_metadata?.full_name || "Mateo Rodriguez",
        role: "MAINTENANCE TECHNICIAN",
        id: "8829",
        avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
    };

    const stats = {
        activePeriod: "Q3",
        completed: 12,
        assigned: 3,
        progress: 85
    };

    const pendingTrainings = [
        {
            id: 1,
            title: "Safety: Heavy Machinery II",
            duration: "20m",
            type: "Video & Assessment",
            status: "REQUIRED",
            icon: Settings
        },
        {
            id: 2,
            title: "Hydraulic Systems Lvl 1",
            progress: 30,
            status: "IN PROGRESS",
            icon: Settings // Using Settings for placeholder generic machinery icon
        }
    ];

    const certifications = [
        {
            id: 1,
            title: "Forklift Operator",
            expires: "Oct 2024"
        },
        {
            id: 2,
            title: "Fire Safety Basic",
            expires: "No Expiration"
        }
    ];


    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    // Scanner Logic (Simplified for brevity, can be expanded if needed)
    useEffect(() => {
        let scanner = null;
        if (isScanning) {
            const startScanner = async () => {
                try {
                    scanner = new Html5Qrcode("reader");
                    await scanner.start(
                        { facingMode: "environment" },
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        onScanSuccess,
                        () => { }
                    );
                } catch (err) {
                    console.error("Error starting scanner", err);
                    setIsScanning(false);
                }
            };
            startScanner();
        }
        return () => {
            if (scanner && scanner.isScanning) {
                scanner.stop().then(() => scanner.clear()).catch(console.error);
            }
        };
    }, [isScanning]);

    const onScanSuccess = (decodedText) => {
        // ... (Existing scan logic)
        let qrId = decodedText;
        try {
            const url = new URL(decodedText);
            const pathParts = url.pathname.split('/');
            const scanIndex = pathParts.indexOf('scan');
            if (scanIndex !== -1 && scanIndex + 1 < pathParts.length) {
                qrId = pathParts[scanIndex + 1];
            }
        } catch (e) { }

        setIsScanning(false);
        navigate(`/scan/${qrId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans mb-20">
            {/* Header Section */}
            <div className="bg-[#1e3a8a] text-white pt-6 pb-24 px-6 rounded-b-[2rem] relative shadow-lg">
                {/* Top Bar */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3 opacity-90">
                        <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <span className="font-bold tracking-wider text-sm">COMPANY LOGO</span>
                    </div>

                    <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-medium transition-colors backdrop-blur-sm">
                        <Globe size={14} />
                        <span>EN-US</span>
                    </button>
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden bg-white/10">
                            <img src={userData.avatar} alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-[#1e3a8a] rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold leading-tight">{userData.name}</h1>
                        <p className="text-blue-200 text-xs mt-1 font-medium tracking-wide">
                            {userData.role} • ID: {userData.id}
                        </p>
                    </div>

                    {/* Sign Out (Subtle) */}
                    <button onClick={handleSignOut} className="ml-auto text-white/50 hover:text-white">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content Area - Negative Margin to overlap header */}
            <div className="px-5 -mt-16 relative z-10 flex flex-col gap-6">

                {/* OJT Dashboard Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">OJT Dashboard</h3>
                        <span className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-lg font-medium">
                            Active Period: {stats.activePeriod}
                        </span>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        {/* Circular Progress */}
                        <div className="relative w-24 h-24 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    className="text-gray-100"
                                />
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="transparent"
                                    strokeDasharray={251.2}
                                    strokeDashoffset={251.2 - (251.2 * stats.progress) / 100}
                                    className="text-[#1e3a8a]"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-xl font-bold text-gray-800">{stats.progress}%</span>
                        </div>

                        <div className="h-12 w-px bg-gray-100 mx-4"></div>

                        <div className="flex-1 flex justify-around text-center">
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Completed</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">Assigned</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Trainings */}
                <div>
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h3 className="text-sm font-bold text-gray-800 uppercase border-b-2 border-[#1e3a8a] pb-1 inline-block">
                            Pending Trainings
                        </h3>
                        <button className="text-xs font-semibold text-[#1e3a8a] pb-1 hover:underline">
                            View Catalog
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Training Card 1 (Required) */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-4">
                                    <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center">
                                        <Settings className="text-gray-600 w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-1">{pendingTrainings[0].title}</h4>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {pendingTrainings[0].duration}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText size={12} />
                                                {pendingTrainings[0].type}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2 py-1 rounded">
                                    {pendingTrainings[0].status}
                                </span>
                            </div>
                            <button
                                onClick={() => setIsScanning(true)} // Example action
                                className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                            >
                                Initialize Session <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Training Card 2 (In Progress) */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex gap-4 items-center">
                                    <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center">
                                        <div className="flex gap-0.5">
                                            <div className="w-1 h-3 bg-gray-400 rounded-full"></div>
                                            <div className="w-1 h-4 bg-gray-600 rounded-full"></div>
                                            <div className="w-1 h-2 bg-gray-400 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm mb-1">{pendingTrainings[1].title}</h4>
                                        <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-[#1e3a8a] w-[30%] rounded-full"></div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wide">
                                            Progress: {pendingTrainings[1].progress}%
                                        </div>
                                    </div>
                                </div>
                                <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded">
                                    {pendingTrainings[1].status}
                                </span>
                            </div>
                            <div className="flex justify-end mt-2">
                                <button className="text-[#1e3a8a] font-bold text-sm flex items-center gap-1 hover:underline">
                                    Resume <Play size={16} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Certifications */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 px-1">
                        Recent Certifications
                    </h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar">
                        {certifications.map(cert => (
                            <div key={cert.id} className="min-w-[200px] bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <div className="relative">
                                        <div className="w-6 h-8 bg-gray-200 rounded-sm"></div>
                                        <div className="absolute -bottom-1 -right-1 bg-[#1e3a8a] text-white rounded-full p-0.5">
                                            <CheckCircle size={10} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm leading-tight">{cert.title}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Expires {cert.expires}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Scanner Overlay */}
            {isScanning && (
                <div className="fixed inset-0 z-[60] bg-black flex flex-col">
                    <div className="flex justify-between items-center p-4 text-white">
                        <h2 className="text-lg font-semibold">Scan QR Code</h2>
                        <button onClick={() => setIsScanning(false)} className="p-2 bg-white/20 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div id="reader" className="flex-1 w-full bg-black"></div>
                    <div className="p-6 bg-black text-white text-center pb-20">
                        <p className="text-sm text-gray-400">Point your camera at a training QR code</p>
                    </div>
                </div>
            )}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-6 py-2 flex justify-between items-end z-50 h-[80px]">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`flex flex-col items-center gap-1 mb-3 ${activeTab === 'overview' ? 'text-[#1e3a8a]' : 'text-gray-400'}`}
                >
                    <LayoutGrid size={24} strokeWidth={activeTab === 'overview' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">OVERVIEW</span>
                </button>

                <button
                    onClick={() => setActiveTab('academy')}
                    className={`flex flex-col items-center gap-1 mb-3 ${activeTab === 'academy' ? 'text-[#1e3a8a]' : 'text-gray-400'}`}
                >
                    <GraduationCap size={24} strokeWidth={activeTab === 'academy' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">ACADEMY</span>
                </button>

                {/* Floating Scan Button */}
                <div className="relative -top-6">
                    <button
                        onClick={() => setIsScanning(true)}
                        className="w-14 h-14 bg-[#1e3a8a] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-900/40 hover:scale-105 transition-transform"
                    >
                        <QrCode size={28} />
                    </button>
                </div>

                <button
                    onClick={() => setActiveTab('log')}
                    className={`flex flex-col items-center gap-1 mb-3 ${activeTab === 'log' ? 'text-[#1e3a8a]' : 'text-gray-400'}`}
                >
                    <ClipboardList size={24} strokeWidth={activeTab === 'log' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">LOG</span>
                </button>

                <button
                    onClick={() => setActiveTab('account')}
                    className={`flex flex-col items-center gap-1 mb-3 ${activeTab === 'account' ? 'text-[#1e3a8a]' : 'text-gray-400'}`}
                >
                    <User size={24} strokeWidth={activeTab === 'account' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">ACCOUNT</span>
                </button>
            </div>
        </div>
    );
};

export default UserDashboard;
