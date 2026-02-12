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

    const [stats, setStats] = useState({
        activePeriod: "Q3",
        completed: 0,
        assigned: 0,
        progress: 0
    });
    const [pendingTrainings, setPendingTrainings] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState({
        name: user?.email?.split('@')[0] || "Worker",
        role: "EMPLOYEE",
        id: "---",
        avatar: "https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=Worker"
    });

    const [completedTrainings, setCompletedTrainings] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            setLoading(true);

            try {
                // 1. Fetch Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserProfile({
                        name: profile.full_name || user.email.split('@')[0],
                        role: profile.role ? profile.role.toUpperCase() : "EMPLOYEE",
                        id: profile.id.substring(0, 4).toUpperCase(), // Short ID for display
                        avatar: `https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=${profile.full_name || 'Worker'}`
                    });
                }

                // 2. Fetch Training Stats & Pending/Completed Trainings
                const { data: progressData, error: progressError } = await supabase
                    .from('training_progress')
                    .select(`
                        id,
                        status,
                        content_id,
                        completed_at,
                        training_content (
                            id,
                            title,
                            type,
                            duration: type 
                        )
                    `)
                    .eq('user_id', user.id);

                if (progressError) throw progressError;

                let completed = 0;
                let started = 0;
                const activeTrainings = [];
                const finishedTrainings = [];

                progressData.forEach(item => {
                    if (item.status === 'completed') {
                        completed++;
                        finishedTrainings.push({
                            id: item.content_id,
                            title: item.training_content?.title || "Unknown Training",
                            type: item.training_content?.type || "Module",
                            completedAt: item.completed_at ? new Date(item.completed_at).toLocaleDateString() : "Unknown Date",
                        });
                    }
                    if (item.status === 'started') {
                        started++;
                        activeTrainings.push({
                            id: item.content_id,
                            title: item.training_content?.title || "Unknown Training",
                            duration: "20m", // Placeholder as schema doesn't have duration
                            type: item.training_content?.type || "Module",
                            status: "IN PROGRESS",
                            progress: 30, // Placeholder, usually needs column for %
                            icon: Settings
                        });
                    }
                });

                const total = completed + started;
                const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                setStats({
                    activePeriod: "Q1", // Dynamic if available
                    completed,
                    assigned: total,
                    progress: progressPercentage
                });

                setPendingTrainings(activeTrainings);
                setCompletedTrainings(finishedTrainings);

                // 3. Fetch Certificates
                const { data: certData, error: certError } = await supabase
                    .from('certificates')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('issued_at', { ascending: false });

                if (certError) throw certError;

                const mappedCerts = certData.map(c => ({
                    id: c.id,
                    title: c.course_name,
                    expires: c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "No Expiration"
                }));

                setCertifications(mappedCerts);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);


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

    const [academyContent, setAcademyContent] = useState([]);
    const [scanError, setScanError] = useState(null);

    // Account Management State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [newName, setNewName] = useState("");
    const [passwordForm, setPasswordForm] = useState({ newPassword: "", confirmPassword: "" });
    const [accountMessage, setAccountMessage] = useState({ type: "", text: "" });

    // ... (existing useEffect for dashboard data)

    // ... (existing handleSignOut)

    const handleUpdateProfile = async () => {
        if (!newName.trim()) {
            setAccountMessage({ type: "error", text: "Name cannot be empty." });
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ full_name: newName })
                .eq('id', user.id);

            if (error) throw error;

            setUserProfile(prev => ({ ...prev, name: newName }));
            setAccountMessage({ type: "success", text: "Profile updated successfully." });
            setIsEditingProfile(false);
        } catch (error) {
            console.error("Error updating profile:", error);
            setAccountMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setAccountMessage({ type: "error", text: "Passwords do not match." });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setAccountMessage({ type: "error", text: "Password must be at least 6 characters." });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
            if (error) throw error;

            setAccountMessage({ type: "success", text: "Password updated successfully." });
            setPasswordForm({ newPassword: "", confirmPassword: "" });
        } catch (error) {
            console.error("Error updating password:", error);
            setAccountMessage({ type: "error", text: "Failed to update password." });
        } finally {
            setLoading(false);
        }
    };

    // ... (existing useEffect for scanner)

    const onScanSuccess = async (decodedText) => {
        setIsScanning(false);
        setLoading(true);
        setScanError(null);

        try {
            let qrId = decodedText;
            try {
                const url = new URL(decodedText);
                const pathParts = url.pathname.split('/');
                const scanIndex = pathParts.indexOf('scan');
                if (scanIndex !== -1 && scanIndex + 1 < pathParts.length) {
                    qrId = pathParts[scanIndex + 1];
                }
            } catch (e) {
                // Not a URL, use raw text
            }

            console.log("Scanned QR ID:", qrId);

            // 1. Get Content IDs from Mapping
            const { data: mappings, error: mapError } = await supabase
                .from('qr_content_mapping')
                .select('content_id')
                .eq('qr_id', qrId);

            if (mapError) throw mapError;

            if (!mappings || mappings.length === 0) {
                setScanError("No training content found for this QR code.");
                setActiveTab('academy');
                setAcademyContent([]);
                setLoading(false);
                return;
            }

            const contentIds = mappings.map(m => m.content_id);

            // 2. Fetch Content Details
            const { data: contents, error: contentError } = await supabase
                .from('training_content')
                .select('*')
                .in('id', contentIds);

            if (contentError) throw contentError;

            // 3. Fetch User Progress for these contents
            const { data: progress, error: progressError } = await supabase
                .from('training_progress')
                .select('content_id, status')
                .eq('user_id', user.id)
                .in('content_id', contentIds);

            if (progressError) throw progressError;

            // 4. Filter Uncompleted
            const completedIds = progress
                .filter(p => p.status === 'completed')
                .map(p => p.content_id);

            const uncompletedCourses = contents.filter(c => !completedIds.includes(c.id));

            // Map to UI format
            const formattedCourses = uncompletedCourses.map(c => ({
                id: c.id,
                title: c.title,
                type: c.type,
                duration: "20m", // Placeholder
                description: "Scan result content", // Placeholder
                status: "PENDING"
            }));

            setAcademyContent(formattedCourses);
            setActiveTab('academy');

        } catch (error) {
            console.error("Scan Error:", error);
            setScanError("Failed to load content. Please try again.");
            setActiveTab('academy');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans mb-20">

            {/* Conditional Header */}
            {activeTab === 'overview' ? (
                /* Overview Header (Blue) */
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
                    {loading ? (
                        <div className="flex items-center gap-4 animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-white/20"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-32 bg-white/20 rounded"></div>
                                <div className="h-3 w-24 bg-white/20 rounded"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-2 border-white/30 overflow-hidden bg-white/10">
                                    <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-[#1e3a8a] rounded-full"></div>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold leading-tight">{userProfile.name}</h1>
                                <p className="text-blue-200 text-xs mt-1 font-medium tracking-wide">
                                    {userProfile.role} • ID: {userProfile.id}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Academy / Account / Log Header (White/Simple) */
                <div className="bg-white pt-6 px-6 pb-2">
                    <div className="flex justify-between items-center mb-6">
                        {/* Status Bar Placeholder if needed, or just padding */}
                    </div>
                </div>
            )}


            {/* Main Content Area */}
            <div className={`px-5 relative z-10 flex flex-col gap-6 ${activeTab === 'overview' ? '-mt-16' : 'mt-0'}`}>

                {activeTab === 'overview' && (
                    <>
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
                                <div className="relative w-24 h-24 flex-shrink-0">
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
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold text-[#1e3a8a]">{stats.progress}%</span>
                                    </div>
                                </div>

                                {/* Stats List */}
                                <div className="space-y-3 ml-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <div className="text-sm">
                                            <span className="font-bold text-gray-900">{stats.completed}</span>
                                            <span className="text-gray-500 ml-1">Completed</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#1e3a8a]"></div>
                                        <div className="text-sm">
                                            <span className="font-bold text-gray-900">{stats.assigned}</span>
                                            <span className="text-gray-500 ml-1">Assigned</span>
                                        </div>
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
                                <button onClick={() => setActiveTab('academy')} className="text-xs font-semibold text-[#1e3a8a] pb-1 hover:underline">
                                    View Catalog
                                </button>
                            </div>

                            <div className="space-y-4">
                                {loading ? (
                                    <div className="space-y-4">
                                        <div className="h-24 bg-white rounded-2xl animate-pulse"></div>
                                        <div className="h-24 bg-white rounded-2xl animate-pulse"></div>
                                    </div>
                                ) : pendingTrainings.length === 0 ? (
                                    <div className="bg-white p-6 rounded-2xl text-center text-gray-500 shadow-sm border border-gray-100">
                                        <p>No pending trainings.</p>
                                        <button onClick={() => setActiveTab('academy')} className="mt-2 text-blue-600 font-semibold text-sm hover:underline">Browse Catalog</button>
                                    </div>
                                ) : (
                                    pendingTrainings.map((training) => (
                                        <div key={training.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-4 items-center">
                                                    <div className="bg-gray-50 w-12 h-12 rounded-xl flex items-center justify-center">
                                                        <Settings className="text-gray-600 w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-sm mb-1">{training.title}</h4>
                                                        {training.status === 'IN PROGRESS' ? (
                                                            <>
                                                                <div className="w-32 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                                                    <div className="h-full bg-[#1e3a8a] w-[30%] rounded-full"></div>
                                                                </div>
                                                                <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wide">
                                                                    Progress: 30%
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                <div className="flex items-center gap-1">
                                                                    <Clock size={12} /> 20m
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <FileText size={12} /> {training.type}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2 py-0.5 rounded">
                                                    {training.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                                {training.status === 'IN PROGRESS' ? (
                                                    <button className="text-[#1e3a8a] font-bold text-sm flex items-center gap-1 hover:underline">
                                                        Resume <Play size={16} fill="currentColor" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setIsScanning(true)
                                                        }}
                                                        className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        Initialize Session <ChevronRight size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Recent Certifications */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 uppercase mb-4 px-1">
                                Recent Certifications
                            </h3>
                            {loading ? (
                                <div className="flex gap-4">
                                    <div className="w-48 h-20 bg-white rounded-xl animate-pulse"></div>
                                    <div className="w-48 h-20 bg-white rounded-xl animate-pulse"></div>
                                </div>
                            ) : certifications.length === 0 ? (
                                <div className="text-gray-500 text-sm px-1 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    No certifications yet. Complete a course to earn one!
                                </div>
                            ) : (
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
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'academy' && (
                    <div className="flex flex-col gap-6 pt-4">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-[#0f172a] mb-1">Academy</h2>
                            <p className="text-gray-500 text-sm">Explore your assigned training modules</p>
                        </div>

                        {scanError && <span className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{scanError}</span>}

                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-32 bg-gray-100 rounded-2xl"></div>
                                <div className="h-32 bg-gray-100 rounded-2xl"></div>
                            </div>
                        ) : academyContent.length > 0 ? (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                                    <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                                        <QrCode size={16} /> Content from Scan
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">Showing {academyContent.length} uncompleted course(s).</p>
                                </div>
                                {academyContent.map(course => (
                                    <div key={course.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-4">
                                                <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600">
                                                    <BookOpen size={24} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-sm mb-1">{course.title}</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{course.description}</p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                                                        <span className="flex items-center gap-1"><FileText size={12} /> {course.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="w-full bg-[#1e3a8a] text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-900 transition-colors mt-2">
                                            Start Training
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center mt-10 text-center">
                                <div className="w-32 h-32 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <QrCode className="text-gray-400 w-12 h-12" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-[#0f172a] font-bold text-lg mb-2">No Machine Scanned</h3>
                                <p className="text-gray-500 text-sm max-w-[250px] leading-relaxed mb-8">
                                    Scan a QR code to view specific training lectures and safety guides.
                                </p>
                                <button
                                    onClick={() => setIsScanning(true)}
                                    className="bg-[#1e3a8a] text-white px-8 py-3.5 rounded-xl text-sm font-semibold shadow-xl shadow-blue-900/10 hover:shadow-blue-900/20 transition-all flex items-center gap-2"
                                >
                                    <QrCode size={18} /> Scan QR Code
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Placeholders for other tabs */}
                {activeTab === 'log' && (
                    <div className="bg-white p-8 rounded-2xl text-center border border-gray-100 shadow-sm mt-10">
                        <p className="text-gray-500">Log content coming soon.</p>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="flex flex-col pt-10 px-2">
                        {/* Profile Header */}
                        <div className="flex flex-col items-center mb-12">
                            <div className="relative mb-4">
                                <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden">
                                    <img src={userProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-[#1e3a8a] text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-blue-900 transition-colors">
                                    <Camera size={16} />
                                </label>
                                <input type="file" id="avatar-upload" className="hidden" />
                            </div>

                            {isEditingProfile ? (
                                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="text-center text-xl font-bold text-[#0f172a] border-b-2 border-blue-100 focus:border-[#1e3a8a] outline-none px-2 py-1 w-full bg-transparent"
                                        placeholder="Full Name"
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleUpdateProfile}
                                            className="text-xs bg-[#1e3a8a] text-white px-4 py-1.5 rounded-full font-medium"
                                        >
                                            Save
                                        </button>
                                        <button
                                            onClick={() => setIsEditingProfile(false)}
                                            className="text-xs bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-[#0f172a] mb-1">{userProfile.name}</h2>
                                    <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mb-3">{userProfile.role}</p>
                                    <span className="bg-gray-50 text-gray-500 text-xs font-medium px-4 py-1 rounded-full">
                                        ID: {userProfile.id}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Menu List */}
                        <div className="flex flex-col gap-4">
                            {/* Edit Profile Button */}
                            <button
                                onClick={() => {
                                    setNewName(userProfile.name);
                                    setIsEditingProfile(true);
                                    setAccountMessage({ type: "", text: "" }); // Clear messages
                                }}
                                className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1e3a8a] shadow-sm group-hover:scale-105 transition-transform">
                                        <User size={20} />
                                    </div>
                                    <span className="font-semibold text-gray-900">Edit Profile</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>

                            {/* Change Password (Toggle) */}
                            <div className="bg-gray-50/50 rounded-2xl overflow-hidden transition-all">
                                <button
                                    onClick={() => {
                                        setPasswordForm(prev => ({ ...prev, show: !prev.show }));
                                        setAccountMessage({ type: "", text: "" }); // Clear messages
                                    }}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1e3a8a] shadow-sm group-hover:scale-105 transition-transform">
                                            <Shield size={20} />
                                        </div>
                                        <span className="font-semibold text-gray-900">Change Password</span>
                                    </div>
                                    <ChevronRight size={20} className={`text-gray-400 transition-transform ${passwordForm.show ? 'rotate-90' : ''}`} />
                                </button>

                                {passwordForm.show && (
                                    <div className="p-4 pt-0">
                                        <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-3 mt-2">
                                            {accountMessage.text && (
                                                <p className={`text-xs p-2 rounded ${accountMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                    {accountMessage.text}
                                                </p>
                                            )}
                                            <input
                                                type="password"
                                                placeholder="New Password"
                                                className="w-full text-sm border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none transition-all"
                                                value={passwordForm.newPassword}
                                                onChange={e => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))}
                                            />
                                            <input
                                                type="password"
                                                placeholder="Confirm Password"
                                                className="w-full text-sm border-gray-200 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#1e3a8a]/20 outline-none transition-all"
                                                value={passwordForm.confirmPassword}
                                                onChange={e => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))}
                                            />
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={loading}
                                                className="w-full bg-[#1e3a8a] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors"
                                            >
                                                {loading ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* App Settings Placeholder */}
                            <button className="flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 rounded-2xl transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#1e3a8a] shadow-sm group-hover:scale-105 transition-transform">
                                        <Settings size={20} />
                                    </div>
                                    <span className="font-semibold text-gray-900">App Settings</span>
                                </div>
                                <ChevronRight size={20} className="text-gray-400" />
                            </button>

                            {/* Logout */}
                            <div className="pt-8 mb-8">
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-4 p-4 hover:bg-red-50 w-full rounded-2xl transition-colors group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100 transition-colors">
                                        <LogOut size={20} />
                                    </div>
                                    <span className="font-bold text-red-500">Logout</span>
                                </button>
                            </div>

                        </div>
                    </div>
                )}


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
                    <BookOpen size={24} strokeWidth={activeTab === 'academy' ? 2.5 : 2} />
                    <span className="text-[10px] font-bold">ACADEMY</span>
                </button>

                {/* Scan Button (Floating) */}
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
