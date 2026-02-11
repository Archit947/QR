import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Download, Printer, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { qrAPI } from '../lib/apiService';

const QRManagement = () => {
    const [qrCodes, setQrCodes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newQR, setNewQR] = useState({ machineName: '', location: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const loadQRCodes = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await qrAPI.getAll();
            setQrCodes(data);
        } catch (err) {
            setError(err.message || 'Failed to load QR codes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQRCodes();
    }, []);

    const filteredQRCodes = useMemo(() => {
        if (!searchTerm.trim()) return qrCodes;
        const term = searchTerm.toLowerCase();
        return qrCodes.filter((qr) =>
            qr.machine_name?.toLowerCase().includes(term) ||
            qr.location?.toLowerCase().includes(term)
        );
    }, [qrCodes, searchTerm]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            setError(null);
            const created = await qrAPI.create({
                machineName: newQR.machineName,
                location: newQR.location,
            });
            setQrCodes((prev) => [created, ...prev]);
            setShowModal(false);
            setNewQR({ machineName: '', location: '' });
        } catch (err) {
            setError(err.message || 'Failed to create QR code');
        } finally {
            setSubmitting(false);
        }
    };

    const downloadQR = (id, machineName) => {
        const svg = document.getElementById(`qr-${id}`);
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `QR-${machineName.replace(/\s+/g, '-')}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">QR Code Management</h2>
                    <p className="text-sm text-gray-500">Manage machine QR codes stored in Supabase.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadQRCodes}
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
                        <span>Create New QR</span>
                    </button>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by machine name or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {/* QR Grid */}
            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    Loading QR codes...
                </div>
            ) : filteredQRCodes.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    No QR codes found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQRCodes.map((qr) => (
                    <div key={qr.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex flex-col items-center mb-6">
                            <div className="bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                <QRCodeSVG
                                    id={`qr-${qr.id}`}
                                        value={`${window.location.origin}/scan/${qr.id}`}
                                    size={150}
                                    level={"H"}
                                    includeMargin={true}
                                />
                            </div>
                            <h3 className="mt-4 font-bold text-lg text-gray-800">{qr.machine_name}</h3>
                            <p className="text-sm text-gray-500">{qr.location}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                    onClick={() => downloadQR(qr.id, qr.machine_name)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 text-sm font-medium"
                            >
                                <Download size={16} />
                                Download
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 text-sm font-medium">
                                <Printer size={16} />
                                Print
                            </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-50 text-center">
                            <p className="text-xs text-gray-400">Created: {qr.created_at ? new Date(qr.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Create New QR Code</h3>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Machine Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newQR.machineName}
                                    onChange={(e) => setNewQR({ ...newQR, machineName: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g., Lathe Machine A1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Department</label>
                                <input
                                    type="text"
                                    required
                                    value={newQR.location}
                                    onChange={(e) => setNewQR({ ...newQR, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g., Assembly Line"
                                />
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
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Generate QR'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRManagement;
