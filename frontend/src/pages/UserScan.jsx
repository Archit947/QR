import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { qrAPI, employeeAPI } from '../lib/apiService';
import { useAuth } from '../lib/AuthContext';
import { PlayCircle, FileText, CheckCircle, ArrowLeft, Award, Lock, LogOut } from 'lucide-react';
import ReactPlayer from 'react-player';

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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-bl-full -mr-10 -mt-10"></div>
                
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <h1 className="text-2xl font-bold">{machineData.machine_name}</h1>
                        <p className="text-slate-400 text-sm mt-1">{machineData.location}</p>
                    </div>
                    <button onClick={handleSignOut} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg">
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>Training Progress</span>
                        <span>{completedAll ? '100%' : 'In Progress'}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ 
                                width: machineData.training_content?.length 
                                    ? `${(Object.values(progressMap).filter(s => s === 'completed').length / machineData.training_content.length) * 100}%` 
                                    : '0%' 
                            }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Completion Certificate Banner */}
            {completedAll && (
                <div className="mx-4 mt-6 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl text-white shadow-lg animate-fade-in flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Award size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold">You are certified!</p>
                        <p className="text-xs text-green-100">You can now operate this machine safely.</p>
                    </div>
                </div>
            )}

            {/* Content List */}
            <div className="p-4 space-y-4">
                <h3 className="font-bold text-gray-800 text-lg px-2">Training Modules</h3>
                
                {machineData.training_content?.map((content, idx) => {
                    const isCompleted = progressMap[content.id] === 'completed';
                    const isLocked = idx > 0 && progressMap[machineData.training_content[idx - 1].id] !== 'completed'; // Sequential lock

                    return (
                        <div 
                            key={content.id}
                            onClick={() => !isLocked && setActiveContent(content)}
                            className={`
                                relative p-4 rounded-xl border transition-all duration-200
                                ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100 shadow-sm'}
                                ${isLocked ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:shadow-md cursor-pointer active:scale-[0.99]'}
                            `}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                                    ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}
                                `}>
                                    {content.type === 'Video' ? <PlayCircle size={24} /> : <FileText size={24} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-semibold ${isCompleted ? 'text-green-800' : 'text-gray-800'}`}>
                                        {content.title}
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">{content.type} • 5 mins</p>
                                </div>
                                <div>
                                    {isCompleted ? (
                                        <CheckCircle className="text-green-500" size={24} />
                                    ) : isLocked ? (
                                        <Lock className="text-gray-300" size={20} />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-200"></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Active Content Modal / Viewer */}
            {activeContent && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col pt-10 animate-fade-in">
                    <div className="flex justify-between items-center px-4 mb-4 text-white">
                        <button 
                            onClick={() => setActiveContent(null)}
                            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
                        >
                            <ArrowLeft size={20} /> Back to List
                        </button>
                        <h3 className="font-semibold text-lg truncate max-w-[200px]">{activeContent.title}</h3>
                    </div>

                    <div className="flex-1 bg-black flex items-center justify-center relative">
                        {activeContent.type === 'Video' ? (
                            <ReactPlayer
                                url={activeContent.url}
                                width="100%"
                                height="100%"
                                controls
                                onEnded={() => markComplete(activeContent.id)}
                            />
                        ) : (
                            <div className="w-full h-full bg-white text-black p-4 overflow-auto">
                                <div className="max-w-3xl mx-auto py-10">
                                    <h2 className="text-2xl font-bold mb-4">{activeContent.title}</h2>
                                    <p className="text-gray-600 mb-8">Please read the following document carefully.</p>
                                    <iframe src={activeContent.url} className="w-full h-[60vh] border rounded-lg" title="PDF Viewer" />
                                    <button 
                                        onClick={() => markComplete(activeContent.id)}
                                        className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-bold"
                                    >
                                        I have read and understood this document
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserScan;
