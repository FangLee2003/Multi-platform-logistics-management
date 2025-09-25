import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import LoginForm from "./components/LoginForm";
import Dashboard from "./pages/Dashboard";
import I18nDemo from "./pages/I18nDemo";
// Tạo QueryClient instance
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 phút
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
function App() {
    const { t } = useTranslation();
    const [user, setUser] = useState(() => {
        return null;
    });
    const handleLogin = (user) => {
        console.log(t('auth.login.loginSuccess'), user);
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
    };
    const handleLogout = () => {
        console.log(t('navigation.logout'));
        setUser(null);
        localStorage.removeItem("user");
    };
    console.log("Current user:", user);
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: !user ? (_jsx(LoginForm, { onLogin: handleLogin })) : (_jsx(Navigate, { to: "/dashboard", replace: true })) }), _jsx(Route, { path: "/dashboard", element: user ? (_jsx(Dashboard, { user: user, onLogout: handleLogout })) : (_jsx(Navigate, { to: "/", replace: true })) }), _jsx(Route, { path: "/demo", element: _jsx(I18nDemo, {}) })] }) }) }));
}
export default App;
