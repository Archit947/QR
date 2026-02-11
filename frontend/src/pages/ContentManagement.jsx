import React, { useEffect, useMemo, useState } from 'react';
import { Plus, FileText, Video, Trash2, Link as LinkIcon, Search, RefreshCw, AlertCircle, Upload, X } from 'lucide-react';
import { contentAPI, qrAPI } from '../lib/apiService';
import { supabase } from '../lib/supabaseClient';

const ContentManagement = () => {
    const [contents, setContents] = useState([]);
    const [qrOptions, setQROptions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [activeContent, setActiveContent] = useState(null);
    const [newContent, setNewContent] = useState({ title: '', type: 'PDF', url: '' });
    const [selectedQrIds, setSelectedQrIds] = useState([]);
    const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(null);
    const [error, setError] = useState(null);

    const loadContent = async () => {
        try {
            setLoading(true);
            setError(null);
            const [contentData, qrData] = await Promise.all([
                contentAPI.getAll(),
                qrAPI.getAll(),
            ]);

            const qrMap = qrData.reduce((acc, qr) => {
                acc[qr.id] = qr;
                return acc;
            }, {});

            const normalized = contentData.map((item) => ({
                ...item,
                linkedToIds: item.qr_content_mapping?.map((m) => m.qr_id) || [],
                linkedToNames: item.qr_content_mapping?.map((mapping) =>
                    qrMap[mapping.qr_id]?.machine_name || `QR ${mapping.qr_id?.slice(0, 8)}...`
                ) || [],
            }));

            setContents(normalized);
            setQROptions(qrData);
        } catch (err) {
            setError(err.message || 'Failed to load training content');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContent();
    }, []);

    const filteredContents = useMemo(() => {
        return contents.filter((item) => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesType = typeFilter === 'All' || item.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [contents, searchTerm, typeFilter]);

    const resetForm = () => {
        setNewContent({ title: '', type: 'PDF', url: '' });
        setSelectedQrIds([]);
        setActiveContent(null);
        setUploadMode('url');
        setSelectedFile(null);
        setUploadProgress(0);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this content?')) return;
        try {
            setDeleteLoading(id);
            await contentAPI.delete(id);
            setContents(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            alert(err.message || 'Failed to delete content');
        } finally {
            setDeleteLoading(null);
        }
    };

    const openLinkModal = (content) => {
        setActiveContent(content);
        setSelectedQrIds(content.linkedToIds || []);
        setShowLinkModal(true);
    };

    const handleUpdateLinks = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            await contentAPI.updateLinks(activeContent.id, selectedQrIds);
            await loadContent();
            setShowLinkModal(false);
            resetForm();
        } catch (err) {
            alert(err.message || 'Failed to update links');
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        
        // Validate file type
        const validPdfTypes = ['application/pdf'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
        
        if (newContent.type === 'PDF' && !validPdfTypes.includes(file.type)) {
            alert('Please select a PDF file');
            return;
        }
        
        if (newContent.type === 'Video' && !validVideoTypes.includes(file.type)) {
            alert('Please select a valid video file (MP4, WebM, OGG, MOV)');
            return;
        }
        
        setSelectedFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const uploadFileToSupabase = async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `training-content/${fileName}`;

        const { data, error } = await supabase.storage
            .from('Training')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                onUploadProgress: (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    setUploadProgress(Math.round(percent));
                }
            });

        if (error) throw error;

        // Construct public URL directly (more reliable than getPublicUrl)
        const publicUrl = `https://umdkelzysoumnffzqsrn.supabase.co/storage/v1/object/public/Training/${filePath}`;

        return publicUrl;
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError(null);
            
            let contentUrl = newContent.url;
            
            // If file mode, upload file first
            if (uploadMode === 'file' && selectedFile) {
                contentUrl = await uploadFileToSupabase(selectedFile);
            }
            
            if (!contentUrl) {
                throw new Error('No URL or file provided');
            }
            
            await contentAPI.upload({
                title: newContent.title,
                type: newContent.type,
                url: contentUrl,
                qrIds: selectedQrIds,
            });
            
            setShowModal(false);
            resetForm();
            await loadContent();
        } catch (err) {
            setError(err.message || 'Failed to upload content');
        } finally {
            setSubmitting(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Training Content</h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadContent}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                        disabled={loading}
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        <span>Upload Content</span>
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-700"
                >
                    <option value="All">All Types</option>
                    <option value="PDF">PDF</option>
                    <option value="Video">Video</option>
                </select>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    Loading content...
                </div>
            ) : filteredContents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    No training content found.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Title</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Type</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Linked To</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredContents.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${item.type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {item.type === 'PDF' ? <FileText size={20} /> : <Video size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{item.title}</p>
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs text-blue-600 hover:underline"
                                                >
                                                    {item.url}
                                                </a>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{item.type}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-2">
                                            {item.linkedToNames.length > 0 ? (
                                                item.linkedToNames.map((link, idx) => (
                                                    <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                                                        {link}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-sm italic">Unlinked</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => openLinkModal(item)}
                                                className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                                                title="Manage Links"
                                            >
                                                <LinkIcon size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                                title="Delete Content"
                                                disabled={deleteLoading === item.id}
                                            >
                                                {deleteLoading === item.id ? (
                                                    <RefreshCw size={18} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Link Management Modal */}
            {showLinkModal && activeContent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-2 text-gray-800">Manage Links</h3>
                        <p className="text-sm text-gray-500 mb-4">Select QR codes to link with "{activeContent.title}"</p>
                        
                        <form onSubmit={handleUpdateLinks} className="space-y-4">
                            <div>
                                {qrOptions.length === 0 ? (
                                    <p className="text-sm text-gray-500">No QR codes available.</p>
                                ) : (
                                    <div className="max-h-60 overflow-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                        {qrOptions.map((qr) => (
                                            <label key={qr.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    value={qr.id}
                                                    checked={selectedQrIds.includes(qr.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedQrIds((prev) => [...prev, qr.id]);
                                                        } else {
                                                            setSelectedQrIds((prev) => prev.filter((id) => id !== qr.id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>{qr.machine_name} — <span className="text-gray-500 text-xs">{qr.location}</span></span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowLinkModal(false); resetForm(); }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Upload New Content</h3>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newContent.title}
                                    onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g., Operator Guide"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={newContent.type}
                                    onChange={(e) => setNewContent({ ...newContent, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                                >
                                    <option value="PDF">PDF Document</option>
                                    <option value="Video">Video Tutorial</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Content Source</label>
                                <div className="flex gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => { setUploadMode('url'); setSelectedFile(null); }}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                            uploadMode === 'url'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Enter URL
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setUploadMode('file'); setNewContent({ ...newContent, url: '' }); }}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                                            uploadMode === 'file'
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        Upload File
                                    </button>
                                </div>

                                {uploadMode === 'url' ? (
                                    <input
                                        type="url"
                                        required={uploadMode === 'url'}
                                        value={newContent.url}
                                        onChange={(e) => setNewContent({ ...newContent, url: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        placeholder="https://..."
                                    />
                                ) : (
                                    <div>
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                                isDragging
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                        >
                                            {selectedFile ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-center gap-2 text-green-600">
                                                        <FileText size={24} />
                                                        <span className="font-medium">{selectedFile.name}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedFile(null)}
                                                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 mx-auto"
                                                    >
                                                        <X size={16} />
                                                        Remove
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Upload className="mx-auto mb-3 text-gray-400" size={32} />
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Drag and drop your {newContent.type} file here
                                                    </p>
                                                    <p className="text-xs text-gray-400 mb-3">or</p>
                                                    <label className="cursor-pointer">
                                                        <span className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 inline-block">
                                                            Browse Files
                                                        </span>
                                                        <input
                                                            type="file"
                                                            accept={newContent.type === 'PDF' ? '.pdf' : 'video/*'}
                                                            onChange={(e) => handleFileSelect(e.target.files[0])}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                        {uploadProgress > 0 && uploadProgress < 100 && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                                    <span>Uploading...</span>
                                                    <span>{uploadProgress}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Link to QR Codes</label>
                                {qrOptions.length === 0 ? (
                                    <p className="text-sm text-gray-500">No QR codes available yet.</p>
                                ) : (
                                    <div className="max-h-36 overflow-auto border border-gray-200 rounded-lg p-3 space-y-2">
                                        {qrOptions.map((qr) => (
                                            <label key={qr.id} className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    value={qr.id}
                                                    checked={selectedQrIds.includes(qr.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedQrIds((prev) => [...prev, qr.id]);
                                                        } else {
                                                            setSelectedQrIds((prev) => prev.filter((id) => id !== qr.id));
                                                        }
                                                    }}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span>{qr.machine_name} — <span className="text-gray-500 text-xs">{qr.location}</span></span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-60"
                                    disabled={submitting || (uploadMode === 'file' && !selectedFile) || (uploadMode === 'url' && !newContent.url)}
                                >
                                    {submitting ? (uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Saving...') : 'Upload'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentManagement;
