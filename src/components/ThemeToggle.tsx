import { Button } from './ui/Button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full h-10 w-10 fixed top-4 right-4 z-50"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
            ) : (
                <Moon className="h-5 w-5" />
            )}
        </Button>
    );
};

