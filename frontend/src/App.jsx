import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UiProvider } from './context/UiContext';
import { PageLoader } from './components/ui';
import AppShell from './layout/AppShell';

const Landing = lazy(() => import('./pages/public/Landing'));
const Login = lazy(() => import('./pages/public/Login'));
const Signup = lazy(() => import('./pages/public/Signup'));
const NotFound = lazy(() => import('./pages/public/NotFound'));

const StudentDashboard = lazy(() => import('./pages/student/Dashboard'));
const Practice = lazy(() => import('./pages/student/Practice'));
const TestRunner = lazy(() => import('./pages/student/TestRunner'));
const Results = lazy(() => import('./pages/student/Results'));
const History = lazy(() => import('./pages/student/History'));
const Analytics = lazy(() => import('./pages/student/Analytics'));
const StudyPlan = lazy(() => import('./pages/student/StudyPlan'));
const Revision = lazy(() => import('./pages/student/Revision'));

const Tutor = lazy(() => import('./pages/shared/Tutor'));
const Classes = lazy(() => import('./pages/shared/Classes'));
const ClassDetail = lazy(() => import('./pages/shared/ClassDetail'));
const Announcements = lazy(() => import('./pages/shared/Announcements'));
const Settings = lazy(() => import('./pages/shared/Settings'));
const QuestionBank = lazy(() => import('./pages/shared/QuestionBank'));
const StudentDetail = lazy(() => import('./pages/shared/StudentDetail'));

const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'));
const Assignments = lazy(() => import('./pages/teacher/Assignments'));
const AssignmentNew = lazy(() => import('./pages/teacher/AssignmentNew'));
const AssignmentDetail = lazy(() => import('./pages/teacher/AssignmentDetail'));

const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminClasses = lazy(() => import('./pages/admin/Classes'));
const AdminAudit = lazy(() => import('./pages/admin/Audit'));
const AdminSystem = lazy(() => import('./pages/admin/System'));

function RequireAuth({ children, roles }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <PageLoader />;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace />;
    return children;
}

function GuestOnly({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <PageLoader />;
    return user ? <Navigate to="/app" replace /> : children;
}

function Home() {
    const { user } = useAuth();
    if (user.role === 'admin') return <AdminOverview />;
    if (user.role === 'teacher') return <TeacherDashboard />;
    return <StudentDashboard />;
}

const S = ['student'];
const T = ['teacher', 'admin'];
const A = ['admin'];

function AppRoutes() {
    return (
        <Suspense fallback={<PageLoader />}>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
                <Route path="/test/:id" element={<RequireAuth roles={S}><TestRunner /></RequireAuth>} />

                <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
                    <Route index element={<Home />} />
                    <Route path="practice" element={<RequireAuth roles={S}><Practice /></RequireAuth>} />
                    <Route path="results/:id" element={<Results />} />
                    <Route path="history" element={<RequireAuth roles={S}><History /></RequireAuth>} />
                    <Route path="analytics" element={<RequireAuth roles={S}><Analytics /></RequireAuth>} />
                    <Route path="plan" element={<RequireAuth roles={S}><StudyPlan /></RequireAuth>} />
                    <Route path="revision" element={<RequireAuth roles={S}><Revision /></RequireAuth>} />

                    <Route path="tutor" element={<Tutor />} />
                    <Route path="classes" element={<Classes />} />
                    <Route path="classes/:id" element={<ClassDetail />} />
                    <Route path="students/:id" element={<RequireAuth roles={T}><StudentDetail /></RequireAuth>} />
                    <Route path="announcements" element={<Announcements />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="questions" element={<RequireAuth roles={T}><QuestionBank /></RequireAuth>} />
                    <Route path="assignments" element={<RequireAuth roles={T}><Assignments /></RequireAuth>} />
                    <Route path="assignments/new" element={<RequireAuth roles={T}><AssignmentNew /></RequireAuth>} />
                    <Route path="assignments/:id" element={<RequireAuth roles={T}><AssignmentDetail /></RequireAuth>} />

                    <Route path="admin/users" element={<RequireAuth roles={A}><AdminUsers /></RequireAuth>} />
                    <Route path="admin/classes" element={<RequireAuth roles={A}><AdminClasses /></RequireAuth>} />
                    <Route path="admin/audit" element={<RequireAuth roles={A}><AdminAudit /></RequireAuth>} />
                    <Route path="admin/system" element={<RequireAuth roles={A}><AdminSystem /></RequireAuth>} />
                    <Route path="*" element={<NotFound inApp />} />
                </Route>
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <UiProvider>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </UiProvider>
        </BrowserRouter>
    );
}
