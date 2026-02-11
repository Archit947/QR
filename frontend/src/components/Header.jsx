import React from 'react';
import { Bell, Search, User } from 'lucide-react';

const Header = () => {
    return (
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-96">
                <Search className="text-gray-400 w-5 h-5 mr-2" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="bg-transparent border-none outline-none text-sm w-full text-gray-700"
                />
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-700">Admin User</p>
                        <p className="text-xs text-gray-500">Super Admin</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                        AU
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
