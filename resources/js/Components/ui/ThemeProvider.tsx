import { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    setTheme: () => {},
    isDark: false,
});

export function ThemeProvider({ children }: PropsWithChildren) {
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            return (localStorage.getItem('theme') as Theme) || 'light';
        }
        return 'light';
    });

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const root = document.documentElement;

        if (theme === 'system') {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDark(systemDark);
            root.classList.toggle('dark', systemDark);
        } else {
            const dark = theme === 'dark';
            setIsDark(dark);
            root.classList.toggle('dark', dark);
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
