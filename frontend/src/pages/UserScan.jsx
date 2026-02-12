import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { qrAPI, employeeAPI } from '../lib/apiService';
import { useAuth } from '../lib/AuthContext';
import { PlayCircle, FileText, CheckCircle, ArrowLeft, Award, Lock, LogOut } from 'lucide-react';

const UserScan = () => {
    const { qrId } = useParams();
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [machineData, setMachineData] = useState(null);
    const [progressMap, setProgressMap] = useState({});
    const [activeContent, setActiveContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completedAll, setCompletedAll] = useState(false);
    const [videoError, setVideoError] = useState(null);

    useEffect(() => {
        loadData();
    }, [qrId, user]);

    const loadData = async () => {
        try {
            setLoading(true);
            // 1. Fetch QR & Content
            const qrData = await qrAPI.getById(qrId);
            setMachineData(qrData);

            // 2. Fetch User Progress if logged in
            if (user) {
                const progressData = await employeeAPI.getProgress(user.id);
                const pMap = {};
                progressData.forEach(p => {
                    pMap[p.content_id] = p.status;
                });
                setProgressMap(pMap);
                checkCompletion(qrData.training_content, pMap);
            }
        } catch (err) {
            setError(err.message || 'Failed to load training data');
        } finally {
            setLoading(false);
        }
    };

    const checkCompletion = (contents, pMap) => {
        if (!contents || contents.length === 0) return;
        const allDone = contents.every(c => pMap[c.id] === 'completed');
        setCompletedAll(allDone);
    };

    // Format duration in seconds to human-readable text
    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return '~5 mins'; // Default for content without duration
        
        if (seconds < 60) {
            return `${seconds} sec${seconds !== 1 ? 's' : ''}`;
        }
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (remainingSeconds === 0) {
            return `${minutes} min${minutes !== 1 ? 's' : ''}`;
        }
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')} mins`;
    };

    const markComplete = async (contentId) => {
        if (!user) return;
        try {
            await employeeAPI.updateProgress({
                userId: user.id,
                contentId,
                status: 'completed'
            });
            const newMap = { ...progressMap, [contentId]: 'completed' };
            setProgressMap(newMap);
            checkCompletion(machineData.training_content, newMap);
            // Close active content after completion or keep open? 
            // Let's keep open but show success message or auto-close
        } catch (err) {
            console.error('Failed to mark complete:', err);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-200 max-w-md w-full">
                <p className="font-semibold mb-2">Error Loading Training</p>
                <p>{error}</p>
                <button onClick={() => navigate('/user/dashboard')} className="mt-4 text-sm underline">
                    Go Back
                </button>
            </div>
        </div>
    );

    if (!machineData) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => activeContent ? setActiveContent(null) : navigate('/user/dashboard')}
                            className="text-slate-400 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-bold">{machineData.machine_name}</h1>
                            <p className="text-slate-400 text-xs">{machineData.location}</p>
                        </div>
                    </div>
                    <button onClick={handleSignOut} className="text-slate-400 hover:text-white">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Video Player Section - Only shown when content is active */}
            {activeContent && (
                <div className="bg-black">
                    {activeContent.type === 'Video' ? (
                        <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                            {videoError ? (
                                <div className="text-center p-6 text-white">
                                    <p className="text-red-400 mb-2">⚠ Video failed to load</p>
                                    <p className="text-xs text-gray-400 mb-4">{videoError}</p>
                                    <button 
                                        onClick={() => {
                                            setVideoError(null);
                                            window.location.reload();
                                        }}
                                        className="bg-blue-600 px-4 py-2 rounded text-sm"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <video
                                    key={activeContent.url}
                                    className="w-full h-full"
                                    controls
                                    playsInline
                                    preload="metadata"
                                    controlsList="nodownload"
                                    poster=""
                                    onEnded={() => markComplete(activeContent.id)}
                                    onError={(e) => {
                                        console.error('Video error:', e);
                                        console.log('Video URL:', activeContent.url);
                                        console.log('Error details:', e.target.error);
                                        
                                        let errorMsg = 'Unknown error';
                                        if (e.target.error) {
                                            switch (e.target.error.code) {
                                                case 1:
                                                    errorMsg = 'Video loading aborted';
                                                    break;
                                                case 2:
                                                    errorMsg = 'Network error';
                                                    break;
                                                case 3:
                                                    errorMsg = 'Video format not supported';
                                                    break;
                                                case 4:
                                                    errorMsg = 'Video not found or access denied';
                                                    break;
                                            }
                                        }
                                        setVideoError(errorMsg);
                                    }}
                                    onLoadStart={() => setVideoError(null)}
                                >
                                    <source src={activeContent.url} type="video/mp4" />
                                    <source src={activeContent.url} type="video/webm" />
                                    <source src={activeContent.url} type="video/ogg" />
                                    Your browser does not support the video tag.
                                </video>
                            )}
                        </div>
                    ) : (
                        <div className="w-full bg-white p-4">
                            <div className="max-w-4xl mx-auto">
                                <h2 className="text-2xl font-bold mb-4 text-gray-800">{activeContent.title}</h2>
                                <p className="text-gray-600 mb-4">Please read the following document carefully.</p>
                                <iframe src={activeContent.url} className="w-full h-[70vh] border rounded-lg" title="PDF Viewer" />
                                <button 
                                    onClick={() => markComplete(activeContent.id)}
                                    className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
                                >
                                    I have read and understood this document
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Video Title and Info */}
                    <div className="bg-white border-b border-gray-200 p-4">
                        <h2 className="text-xl font-bold text-gray-800">{activeContent.title}</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {activeContent.type} • {formatDuration(activeContent.duration)}
                        </p>
                        {/* Debug info - remove in production */}
                        <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer">Video URL (debug)</summary>
                            <p className="text-xs text-gray-500 mt-1 break-all font-mono bg-gray-50 p-2 rounded">
                                {activeContent.url}
                            </p>
                            <a 
                                href={activeContent.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                            >
                                Open in new tab to test
                            </a>
                        </details>
                    </div>
                </div>
            )}

            {/* Content List - Always visible */}
            <div className="bg-white">
                {/* Progress Bar */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between text-xs text-gray-600 mb-2">
                        <span className="font-medium">Training Progress</span>
                        <span className="font-semibold text-blue-600">
                            {machineData.training_content?.length 
                                ? `${Object.values(progressMap).filter(s => s === 'completed').length}/${machineData.training_content.length} completed`
                                : '0/0'}
                        </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-500"
                            style={{ 
                                width: machineData.training_content?.length 
                                    ? `${(Object.values(progressMap).filter(s => s === 'completed').length / machineData.training_content.length) * 100}%` 
                                    : '0%' 
                            }}
                        ></div>
                    </div>
                </div>

                {/* Completion Certificate Banner */}
                {completedAll && (
                    <div className="mx-4 my-4 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white shadow-lg flex items-center gap-4">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Award size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold">You are certified!</p>
                            <p className="text-xs text-green-100">You can now operate this machine safely.</p>
                        </div>
                    </div>
                )}

                {/* Training Modules List */}
                <div className="pb-6">
                    <h3 className="font-bold text-gray-800 px-4 py-3 text-sm border-b border-gray-200 bg-gray-50">
                        Training Modules
                    </h3>
                    
                    {machineData.training_content?.map((content, idx) => {
                        const isCompleted = progressMap[content.id] === 'completed';
                        const isLocked = idx > 0 && progressMap[machineData.training_content[idx - 1].id] !== 'completed';
                        const isActive = activeContent?.id === content.id;

                        return (
                            <div 
                                key={content.id}
                                onClick={() => {
                                    if (!isLocked) {
                                        setVideoError(null);
                                        setActiveContent(content);
                                    }
                                }}
                                className={`
                                    flex items-center gap-3 p-4 border-b border-gray-100 transition-colors
                                    ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                                    ${isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}
                                `}
                            >
                                {/* Number Badge */}
                                <div className={`
                                    w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0
                                    ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}
                                `}>
                                    {idx + 1}
                                </div>

                                {/* Icon */}
                                <div className={`
                                    shrink-0
                                    ${isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'}
                                `}>
                                    {content.type === 'Video' ? <PlayCircle size={20} /> : <FileText size={20} />}
                                </div>

                                {/* Content Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium text-sm truncate ${isActive ? 'text-blue-900' : 'text-gray-800'}`}>
                                        {content.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {content.type} • {formatDuration(content.duration)}
                                    </p>
                                </div>

                                {/* Status Icon */}
                                <div className="shrink-0">
                                    {isCompleted ? (
                                        <CheckCircle className="text-green-600" size={20} />
                                    ) : isLocked ? (
                                        <Lock className="text-gray-300" size={18} />
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default UserScan;
