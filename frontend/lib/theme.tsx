'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import DesktopWindowsRoundedIcon from '@mui/icons-material/DesktopWindowsRounded';

export type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

/**
 * Runs in <head> before React hydrates so the page never flashes the wrong theme.
 * Keep the logic in sync with `applyTheme` below.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

function systemPrefersDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(choice: ThemeChoice) {
    const dark = choice === 'dark' || (choice === 'system' && systemPrefersDark());
    document.documentElement.classList.toggle('dark', dark);
    return dark;
}

type ThemeContextValue = {
    theme: ThemeChoice;
    resolved: 'light' | 'dark';
    setTheme: (t: ThemeChoice) => void;
    toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeChoice>('system');
    const [resolved, setResolved] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        let saved: ThemeChoice = 'system';
        try {
            const v = localStorage.getItem(STORAGE_KEY);
            if (v === 'light' || v === 'dark' || v === 'system') saved = v;
        } catch {
            /* storage unavailable */
        }
        setThemeState(saved);
        setResolved(applyTheme(saved) ? 'dark' : 'light');
    }, []);

    // Follow OS changes while on "system"
    useEffect(() => {
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => setResolved(applyTheme('system') ? 'dark' : 'light');
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, [theme]);

    const setTheme = useCallback((t: ThemeChoice) => {
        setThemeState(t);
        setResolved(applyTheme(t) ? 'dark' : 'light');
        try {
            localStorage.setItem(STORAGE_KEY, t);
        } catch {
            /* storage unavailable */
        }
    }, []);

    const toggle = useCallback(() => setTheme(resolved === 'dark' ? 'light' : 'dark'), [resolved, setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>{children}</ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
}

/** Round icon button that flips between light and dark. */
export function ThemeToggleButton({ className = '' }: { className?: string }) {
    const { resolved, toggle } = useTheme();
    const dark = resolved === 'dark';
    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={dark ? 'Light theme' : 'Dark theme'}
            className={`flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface-2 hover:text-fg ${className}`}
        >
            {dark ? <LightModeRoundedIcon fontSize="small" /> : <DarkModeRoundedIcon fontSize="small" />}
        </button>
    );
}

/** Light / Dark / System segmented control. */
export function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const options: { value: ThemeChoice; label: string; Icon: typeof LightModeRoundedIcon }[] = [
        { value: 'light', label: 'Light', Icon: LightModeRoundedIcon },
        { value: 'dark', label: 'Dark', Icon: DarkModeRoundedIcon },
        { value: 'system', label: 'System', Icon: DesktopWindowsRoundedIcon },
    ];
    return (
        <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
            {options.map(({ value, label, Icon }) => {
                const active = theme === value;
                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setTheme(value)}
                        className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
                            active ? 'bg-surface text-fg shadow-sm ring-1 ring-line' : 'text-muted hover:text-fg'
                        }`}
                    >
                        <Icon sx={{ fontSize: 18 }} />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
