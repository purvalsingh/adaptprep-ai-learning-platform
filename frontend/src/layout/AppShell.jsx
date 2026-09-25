import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    BarChart3, Bell, BookMarked, BookOpenCheck, CalendarCheck, ClipboardList, Database, GraduationCap, History, LayoutDashboard,
    LogOut, Megaphone, Menu, Moon, ScrollText, Server, Settings, Sparkles, Sun, Target, Users, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUi } from '../context/UiContext';
import { Avatar } from '../components/ui';
import ChatPanel from '../components/ChatPanel';
import { EXAM_LABEL } from '../lib/format';

const NAV = {
    student: [
        { section: 'Learn' },
        { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/app/practice', label: 'Practice', icon: Target },
        { to: '/app/tutor', label: 'AI Tutor', icon: Sparkles },
        { to: '/app/plan', label: 'Study plan', icon: CalendarCheck },
        { to: '/app/revision', label: 'Revision', icon: BookMarked },
        { section: 'Progress' },
        { to: '/app/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/app/history', label: 'Test history', icon: History },
        { section: 'Community' },
        { to: '/app/classes', label: 'My classes', icon: GraduationCap },
        { to: '/app/announcements', label: 'Announcements', icon: Megaphone }
    ],
    teacher: [
        { section: 'Teach' },
        { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
        { to: '/app/classes', label: 'Classes', icon: GraduationCap },
        { to: '/app/assignments', label: 'Assignments', icon: ClipboardList },
        { to: '/app/questions', label: 'Question bank', icon: Database },
        { section: 'Tools' },
        { to: '/app/tutor', label: 'AI Assistant', icon: Sparkles },
        { to: '/app/announcements', label: 'Announcements', icon: Megaphone }
    ],
    admin: [
        { section: 'Platform' },
        { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
        { to: '/app/admin/users', label: 'Users', icon: Users },
        { to: '/app/admin/classes', label: 'Classes', icon: GraduationCap },
        { to: '/app/questions', label: 'Question bank', icon: Database },
        { to: '/app/announcements', label: 'Announcements', icon: Megaphone },
        { section: 'Governance' },
        { to: '/app/admin/audit', label: 'Audit log', icon: ScrollText },
        { to: '/app/admin/system', label: 'System & AI', icon: Server },
        { to: '/app/tutor', label: 'AI Assistant', icon: Sparkles }
    ]
};

const ROLE_LABEL = { student: 'Student', teacher: 'Teacher', admin: 'Administrator' };

function UserMenu() {
    const { user, logout } = useAuth();
    const { confirm } = useUi();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const doLogout = async () => {
        setOpen(false);
        if (await confirm({ title: 'Sign out?', message: 'You can sign back in any time. Unfinished tests keep running on the server.', confirmText: 'Sign out' })) {
            logout();
            navigate('/login');
        }
    };

    return (
        <div className="dropdown" ref={ref}>
            <button className="user-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
                <Avatar user={user} size={30} />
                <span className="hide-sm small bold" style={{ maxWidth: 120 }}>{user.name.split(' ')[0]}</span>
            </button>
            {open && (
                <div className="dropdown-menu" role="menu">
                    <div style={{ padding: '8px 10px 10px' }}>
                        <div className="bold truncate">{user.name}</div>
                        <div className="xs subtle truncate">{user.email}</div>
                        <div className="row gap-4 mt-8">
                            <span className="badge badge-brand">{ROLE_LABEL[user.role]}</span>
                            {user.role === 'student' && <span className="badge">{EXAM_LABEL[user.examType]}</span>}
                        </div>
                    </div>
                    <hr className="divider" style={{ margin: '4px 0' }} />
                    <Link className="dropdown-item" to="/app/settings" onClick={() => setOpen(false)}><Settings size={16} /> Profile & settings</Link>
                    <button className="dropdown-item danger" onClick={doLogout}><LogOut size={16} /> Sign out</button>
                </div>
            )}
        </div>
    );
}

function AiDrawer() {
    const [open, setOpen] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const location = useLocation();
    if (location.pathname.startsWith('/app/tutor')) return null;
    return (
        <>
            {open && (
                <div className="drawer" role="dialog" aria-label="AdaptPrep AI">
                    <div className="drawer-head">
                        <div className="msg-avatar"><Sparkles size={16} /></div>
                        <div className="grow">
                            <div className="bold small">AdaptPrep AI</div>
                            <div className="xs subtle">Ask anything about your prep</div>
                        </div>
                        <Link to="/app/tutor" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Open full</Link>
                        <button className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="Close assistant"><X size={18} /></button>
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                        <ChatPanel sessionId={sessionId} onSessionCreated={setSessionId} />
                    </div>
                </div>
            )}
            <button className="fab" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}>
                {open ? <X size={24} /> : <Sparkles size={24} />}
            </button>
        </>
    );
}

export default function AppShell() {
    const { user } = useAuth();
    const { theme, setTheme } = useUi();
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const items = NAV[user.role] || NAV.student;

    useEffect(() => { setMenuOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

    return (
        <div className="shell">
            <aside className={`sidebar ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
                <div className="sidebar-head">
                    <Link to="/app" className="brand"><span className="brand-mark"><BookOpenCheck size={18} /></span>AdaptPrep</Link>
                </div>
                <nav className="sidebar-nav">
                    {items.map((it, i) => (it.section
                        ? <div key={i} className="nav-section">{it.section}</div>
                        : (
                            <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                                <it.icon size={18} />{it.label}
                            </NavLink>
                        )))}
                    <NavLink to="/app/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Settings size={18} />Settings</NavLink>
                </nav>
                {user.role === 'student' && (
                    <div className="sidebar-foot">
                        <div className="ai-card">
                            <div className="row gap-8 bold small"><Sparkles size={16} /> AI Adaptive test</div>
                            <p>15 questions picked from your weak topics.</p>
                            <Link to="/app/practice?start=adaptive" className="btn btn-block">Start now</Link>
                        </div>
                    </div>
                )}
            </aside>
            <div className={`scrim ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(false)} />

            <div className="main">
                <header className="topbar">
                    <button className="btn btn-ghost btn-icon menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
                    <div className="grow" />
                    <Link to="/app/announcements" className="btn btn-ghost btn-icon" aria-label="Announcements"><Bell size={18} /></Link>
                    <button className="btn btn-ghost btn-icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <UserMenu />
                </header>
                <main className="content">
                    <Outlet />
                </main>
            </div>
            <AiDrawer />
        </div>
    );
}
