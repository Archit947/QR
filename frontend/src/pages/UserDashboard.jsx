import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { QrCode, LogOut, Camera, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const UserDashboard = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

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
        navigate(`/scan/${qrId}`);
    };

    const onScanFailure = (error) => {
        // handle scan failure, usually better to ignore and keep scanning.
        // console.warn(`Code scan error = ${error}`);
    };

    const startScan = () => {
        setIsScanning(true);
    };

    const stopScan = () => {
        setIsScanning(false);
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
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
                <div className="space-y-2 max-w-xs mx-auto">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Hello, {user?.email?.split('@')[0] || 'Worker'}!
                    </h2>
                    <p className="text-gray-500">
                        Ready to start your shift? Scan the equipment QR code to access safety training.
                    </p>
                </div>

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

                            <p className="text-xs text-gray-400">
                                Clicking above will open your camera to scan.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;
