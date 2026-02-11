import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { QrCode, LogOut, Camera, X, BookOpen, User, CheckCircle, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../lib/supabaseClient';

const UserDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState('scan'); // 'courses' | 'scan' | 'profile'
    const [lastCourseId, setLastCourseId] = useState(null);
    const [passwordState, setPasswordState] = useState({ newPassword: '', confirm: '', message: '', error: '' });

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    useEffect(() => {
        const saved = localStorage.getItem('lastCourseId');
        if (saved) setLastCourseId(saved);
    }, []);

    useEffect(() => {
        let scanner = null; // Local instance

        const startScanner = async () => {
            if (isScanning) {
                try {
                    scanner = new Html5Qrcode("reader");
                    const config = { 
                        fps: 10, 
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0 
                    };
                    
                    await scanner.start(
                        { facingMode: "environment" }, 
                        config, 
                        onScanSuccess, 
                        onScanFailure
                    );
                } catch (err) {
                    console.error("Error starting scanner", err);
                    setIsScanning(false);
                }
            }
        };

        startScanner();

        return () => {
            if (scanner && scanner.isScanning) {
                scanner.stop().then(() => {
                    scanner.clear();
                }).catch(err => {
                    console.error("Failed to stop scanner", err);
                });
            }
        };
    }, [isScanning]);

    const onScanSuccess = (decodedText, decodedResult) => {
        // Handle the scanned code here
        // Expected format: http://.../scan/:id or just :id
        console.log(`Code matched = ${decodedText}`, decodedResult);
        
        let qrId = decodedText;
        // Try to extract ID if it's a full URL
        try {
            const url = new URL(decodedText);
            const pathParts = url.pathname.split('/');
            const scanIndex = pathParts.indexOf('scan');
            if (scanIndex !== -1 && scanIndex + 1 < pathParts.length) {
                qrId = pathParts[scanIndex + 1];
            }
        } catch (e) {
            // Not a URL, use raw text as ID
        }

        setIsScanning(false);
        setLastCourseId(qrId);
        localStorage.setItem('lastCourseId', qrId);
        navigate(`/scan/${qrId}`);
    };

    const onScanFailure = (error) => {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    };

    const startScan = () => {
        setIsScanning(true);
        setActiveTab('scan');
    };

    const stopScan = () => {
        setIsScanning(false);
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordState((p) => ({ ...p, message: '', error: '' }));
        if (!passwordState.newPassword || passwordState.newPassword !== passwordState.confirm) {
            setPasswordState((p) => ({ ...p, error: 'Passwords do not match', message: '' }));
            return;
        }
        try {
            const { error } = await supabase.auth.updateUser({ password: passwordState.newPassword });
            if (error) throw error;
            setPasswordState({ newPassword: '', confirm: '', message: 'Password updated successfully', error: '' });
        } catch (err) {
            setPasswordState((p) => ({ ...p, error: err.message || 'Failed to update password', message: '' }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 py-4 shadow-sm flex justify-between items-center z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <QrCode className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="font-bold text-gray-800 leading-tight">SafetyFirst</h1>
                        <p className="text-xs text-gray-500">Worker Portal</p>
                    </div>
                </div>
                <button 
                    onClick={handleSignOut}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Sign Out"
                >
                    <LogOut size={20} />
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-6 pb-24">
                <div className="space-y-2 max-w-md mx-auto text-center">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Hello, {user?.email?.split('@')[0] || 'Worker'}!
                    </h2>
                    <p className="text-gray-500">
                        Stay on top of your training, scan equipment, and manage your profile.
                    </p>
                </div>

                {/* Tab content */}
                <div className="flex-1 mt-8">
                    {activeTab === 'scan' && (
                        <div className="flex flex-col items-center space-y-6">
                            {isScanning ? (
                                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
                                    <button 
                                        onClick={stopScan}
                                        className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm"
                                    >
                                        <X size={24} />
                                    </button>
                                    <div id="reader" className="w-full h-full"></div>
                                    <p className="absolute bottom-10 left-0 right-0 text-white text-sm p-4 text-center z-20">
                                        Point your camera at the QR code
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="relative group">
                                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
                                        <button
                                            onClick={startScan}
                                            className="relative bg-white p-8 rounded-full shadow-xl shadow-blue-200 border-4 border-white hover:border-blue-50 active:scale-95 transition-all text-blue-600 group-hover:text-blue-700"
                                        >
                                            <Camera size={48} />
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4 max-w-md w-full">
                                        <button 
                                            onClick={startScan}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
                                        >
                                            <Camera size={20} />
                                            <span>Scan QR Code</span>
                                        </button>

                                        <p className="text-xs text-gray-400 text-center">
                                            Scanning opens your camera to start a training session.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <BookOpen className="text-blue-600" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500">Ongoing course</p>
                                        <p className="font-semibold text-gray-800">Equipment Safety Training</p>
                                    </div>
                                </div>
                                {lastCourseId ? (
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="text-sm text-gray-600">Resume last scan: <span className="font-mono text-gray-800">{lastCourseId}</span></div>
                                        <button
                                            onClick={() => navigate(`/scan/${lastCourseId}`)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                                        >
                                            Continue
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No in-progress course found. Scan a QR to start.</p>
                                )}
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                                <div className="flex items-center gap-3 mb-2">
                                    <Shield className="text-green-600" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500">Compliance tip</p>
                                        <p className="font-semibold text-gray-800">Complete all modules to unlock your certificate.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Account</p>
                                <p className="font-semibold text-gray-800">{user?.email}</p>
                                <p className="text-sm text-gray-500">User ID: <span className="font-mono">{user?.id}</span></p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                                <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle className="text-emerald-600" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500">Certificates</p>
                                        <p className="font-semibold text-gray-800">Completed trainings</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">No certificates recorded yet. Complete a training to earn one.</p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                                <p className="text-sm font-semibold text-gray-800 mb-2">Change password</p>
                                <form className="space-y-3" onSubmit={handleChangePassword}>
                                    <input
                                        type="password"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                        placeholder="New password"
                                        value={passwordState.newPassword}
                                        onChange={(e) => setPasswordState((p) => ({ ...p, newPassword: e.target.value }))}
                                        required
                                    />
                                    <input
                                        type="password"
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                        placeholder="Confirm password"
                                        value={passwordState.confirm}
                                        onChange={(e) => setPasswordState((p) => ({ ...p, confirm: e.target.value }))}
                                        required
                                    />
                                    {passwordState.error && <p className="text-sm text-red-600">{passwordState.error}</p>}
                                    {passwordState.message && <p className="text-sm text-emerald-600">{passwordState.message}</p>}
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm"
                                    >
                                        Update password
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg shadow-blue-500/5 px-6 py-3 flex justify-between items-center z-40">
                <button
                    onClick={() => setActiveTab('courses')}
                    className={`flex-1 flex flex-col items-center gap-1 text-xs font-semibold ${activeTab === 'courses' ? 'text-blue-600' : 'text-gray-400'}`}
                >
                    <BookOpen size={22} />
                    <span>Courses</span>
                </button>
                <button
                    onClick={() => setActiveTab('scan')}
                    className={`flex-1 flex flex-col items-center gap-1 text-xs font-semibold ${activeTab === 'scan' ? 'text-blue-600' : 'text-gray-400'}`}
                >
                    <QrCode size={22} />
                    <span>QR Scan</span>
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex-1 flex flex-col items-center gap-1 text-xs font-semibold ${activeTab === 'profile' ? 'text-blue-600' : 'text-gray-400'}`}
                >
                    <User size={22} />
                    <span>Profile</span>
                </button>
            </nav>
        </div>
    );
};

export default UserDashboard;
