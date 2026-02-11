import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, QrCode, FileText, Users, Award, Settings, LogOut } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: QrCode, label: 'QR Management', path: '/admin/qr-codes' },
        { icon: FileText, label: 'Training Content', path: '/admin/content' },
        { icon: Users, label: 'Employee Tracking', path: '/admin/employees' },
        { icon: Award, label: 'Certifications', path: '/admin/certificates' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
    ];

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-300">
            <div className="p-6 border-b border-slate-700 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-xl">
                    Q
                </div>
                <h1 className="text-xl font-bold tracking-tight">QR Trainer</h1>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ${isActive
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button className="flex items-center gap-3 w-full px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <LogOut size={20} />
                    <span className="font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
