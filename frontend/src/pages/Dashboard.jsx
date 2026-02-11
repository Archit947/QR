import React, { useState, useEffect } from 'react';
import { Users, QrCode, ClipboardCheck, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { dashboardAPI } from '../lib/apiService';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalScans: 0,
        activeEmployees: 0,
        completedTrainings: 0,
        complianceRate: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const data = await dashboardAPI.getStats();
            setStats(data);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Keep mock data on error
            setStats({
                totalScans: 1234,
                activeEmployees: 56,
                completedTrainings: 890,
                complianceRate: 98,
            });
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Scans',
            value: stats.totalScans.toLocaleString(),
            icon: QrCode,
            gradient: 'gradient-blue',
            trend: '+12%',
            trendUp: true,
        },
        {
            title: 'Active Employees',
            value: stats.activeEmployees.toLocaleString(),
            icon: Users,
            gradient: 'gradient-green',
            trend: '+5%',
            trendUp: true,
        },
        {
            title: 'Trainings Completed',
            value: stats.completedTrainings.toLocaleString(),
            icon: ClipboardCheck,
            gradient: 'gradient-purple',
            trend: '+18%',
            trendUp: true,
        },
        {
            title: 'Compliance Rate',
            value: `${stats.complianceRate}%`,
            icon: TrendingUp,
            gradient: 'gradient-orange',
            trend: '+2%',
            trendUp: true,
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Last updated: {new Date().toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
                <button
                    onClick={loadDashboardData}
                    className="btn-primary"
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Refresh Data'}
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="stat-card group animate-slide-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                                <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>

                                {/* Trend indicator */}
                                <div className="mt-3 flex items-center gap-1.5">
                                    {stat.trendUp ? (
                                        <ArrowUp className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <ArrowDown className="w-4 h-4 text-red-500" />
                                    )}
                                    <span className={`text-sm font-semibold ${stat.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                                        {stat.trend}
                                    </span>
                                    <span className="text-xs text-gray-400">from last month</span>
                                </div>
                            </div>

                            {/* Icon with gradient */}
                            <div className={`p-3.5 rounded-xl ${stat.gradient} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-200`}>
                                <stat.icon size={24} strokeWidth={2.5} />
                            </div>
                        </div>

                        {/* Decorative gradient bar */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl`}></div>
                    </div>
                ))}
            </div>

            {/* Charts and Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Recent Scans</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            View All
                        </button>
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                                        U{i}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                            User #{i}
                                        </p>
                                        <p className="text-xs text-gray-500">Scanned Machine A-{100 + i}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{i * 2} mins ago</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Training Progress */}
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Training Progress</h3>
                        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                            Manage
                        </button>
                    </div>
                    <div className="space-y-5">
                        {['Safety Protocol', 'Machine Operation', 'Hygiene Standards', 'Emergency Exit'].map((training, i) => {
                            const percentage = 85 - i * 10;
                            return (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold text-gray-700">{training}</span>
                                        <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out shadow-sm"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
