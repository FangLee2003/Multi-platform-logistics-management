import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
export default function DriverDashboard({ user, onLogout }) {
    const { t } = useTranslation();
    return (_jsxs("div", { children: [_jsx("h2", { children: t('dashboard.driver.title', 'Driver Dashboard') }), _jsxs("p", { children: [t('dashboard.driver.welcome', 'Hello'), " ", user.name, " (", user.email, ")"] }), _jsx("button", { onClick: onLogout, children: t('navigation.logout') })] }));
}
