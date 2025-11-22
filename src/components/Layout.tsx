import { Link, Outlet, useLocation } from 'react-router-dom';
import { Briefcase, Users, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '../utils/cn';
import { ThemeToggle } from './ThemeToggle';

const Layout = () => {
    const location = useLocation();

    const navItems = [
        { href: '/hr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/hr/create', label: 'Create Job', icon: Briefcase },
        { href: '/recruiter/dashboard', label: 'Recruiter', icon: Users },
        { href: '/debug', label: 'Debug', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <ThemeToggle />
            <nav className="border-b bg-card">
                <div className="container mx-auto flex h-16 items-center px-4">
                    <Link to="/" className="mr-8 flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer">
                        <Briefcase className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-black to-purple-600 dark:from-white dark:to-purple-400">HireWiseAI</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                        isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </nav>
            <main className="container mx-auto py-6 px-4">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
