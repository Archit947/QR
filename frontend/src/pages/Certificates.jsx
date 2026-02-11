import React, { useState } from 'react';
import { Search, Award, Download, Eye } from 'lucide-react';

const initialCertificates = [
    { id: '101', employee: 'Jane Smith', course: 'Machining Safety Level 1', date: '2023-11-10', expiry: '2024-11-10' },
    { id: '102', employee: 'John Doe', course: 'Fire Safety Basics', date: '2023-11-12', expiry: '2024-11-12' },
    { id: '103', employee: 'Mike Johnson', course: 'Logistics Protocol', date: '2023-10-05', expiry: '2024-10-05' },
];

const Certificates = () => {
    const [certificates, setCertificates] = useState(initialCertificates);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Certifications</h2>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search certificates..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map((cert) => (
                    <div key={cert.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-400/10 rounded-bl-full -mr-4 -mt-4"></div>

                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                                <Award size={32} />
                            </div>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Valid</span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-800 mb-1">{cert.course}</h3>
                        <p className="text-gray-500 text-sm mb-4">Issued to {cert.employee}</p>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Issued Date</span>
                                <span className="text-gray-700 font-medium">{cert.date}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Valid Until</span>
                                <span className="text-gray-700 font-medium">{cert.expiry}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                                <Eye size={16} />
                                View
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                                <Download size={16} />
                                Download
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Certificates;
