import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
const LanguageSwitcher = () => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const handleLanguageChange = (lang) => {
        console.log('Changing language to:', lang);
        i18n.changeLanguage(lang);
        console.log('Language changed to:', i18n.language);
        setIsOpen(false);
    };
    const languages = [
        { code: 'en', name: t('common.english'), flag: '🇺🇸' },
        { code: 'vi', name: t('common.vietnamese'), flag: '🇻🇳' }
    ];
    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
    return (_jsxs("div", { className: "relative inline-block", children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors", "aria-label": t('common.language'), children: [_jsx("span", { className: "text-lg", children: currentLanguage.flag }), _jsx("span", { children: currentLanguage.name }), _jsx("svg", { className: `w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) })] }), isOpen && (_jsx("div", { className: "absolute right-0 z-50 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg", children: _jsx("div", { className: "py-1", children: languages.map((lang) => (_jsxs("button", { onClick: () => handleLanguageChange(lang.code), className: `flex items-center gap-3 w-full px-4 py-2 text-sm transition-colors ${i18n.language === lang.code
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'}`, children: [_jsx("span", { className: "text-lg", children: lang.flag }), _jsx("span", { children: lang.name }), i18n.language === lang.code && (_jsx("span", { className: "ml-auto text-blue-600", children: "\u2713" }))] }, lang.code))) }) }))] }));
};
export default LanguageSwitcher;
