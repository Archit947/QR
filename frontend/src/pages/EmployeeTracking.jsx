import React, { useEffect, useMemo, useState } from 'react';
import { Search, ChevronDown, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { employeeAPI } from '../lib/apiService';

const EmployeeTracking = () => {
    const [employees, setEmployees] = useState([]);
    const [progress, setProgress] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            setError(null);
            const [employeeList, progressList] = await Promise.all([
                employeeAPI.getAll(),
                employeeAPI.getStats(),
            ]);
            setEmployees(employeeList);
            setProgress(progressList);
        } catch (err) {
            setError(err.message || 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const progressByEmployee = useMemo(() => {
        const map = {};
        progress.forEach((entry) => {
            if (!entry.user_id) return;
            if (!map[entry.user_id]) {
                map[entry.user_id] = { total: 0, completed: 0 };
            }
            map[entry.user_id].total += 1;
            if (entry.status === 'completed') {
                map[entry.user_id].completed += 1;
            }
        });
        return map;
    }, [progress]);

    const enrichedEmployees = useMemo(() => {
        return employees.map((emp) => {
            const stats = progressByEmployee[emp.id] || { total: 0, completed: 0 };
            const completionPercent = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
            const status = stats.total === 0
                ? 'Pending'
                : stats.completed === stats.total
                    ? 'Certified'
                    : 'In Progress';

            return {
                id: emp.id,
                name: emp.full_name || 'Unnamed Employee',
                department: emp.department || 'Unassigned',
                role: emp.role,
                created_at: emp.created_at,
                total: stats.total,
                completed: stats.completed,
                completionPercent,
                status,
            };
        });
    }, [employees, progressByEmployee]);

    const filteredEmployees = useMemo(() => (
        enrichedEmployees.filter((emp) =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department.toLowerCase().includes(searchTerm.toLowerCase())
        )
    ), [enrichedEmployees, searchTerm]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Certified': return 'bg-green-100 text-green-700';
            case 'In Progress': return 'bg-blue-100 text-blue-700';
            case 'Pending': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Employee Tracking</h2>
                    <p className="text-sm text-gray-500">Live data from Supabase profiles and training progress.</p>
                </div>
                <button
                    onClick={loadEmployees}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700"
                    disabled={loading}
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    <span>Filter</span>
                    <ChevronDown size={16} />
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            {loading ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    Loading employees...
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
                    No employees match your search.
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Department</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Progress</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Joined</th>
                                <th className="px-6 py-4 font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.map((emp) => (
                                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-medium text-gray-600">
                                                {emp.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{emp.name}</p>
                                                <p className="text-xs text-gray-500">{emp.role || 'Employee'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{emp.department}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 w-24 bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${emp.completionPercent}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-xs text-gray-500">{emp.completionPercent}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(emp.status)}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-sm flex items-center gap-1">
                                        <Clock size={14} />
                                        {emp.created_at ? new Date(emp.created_at).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EmployeeTracking;
