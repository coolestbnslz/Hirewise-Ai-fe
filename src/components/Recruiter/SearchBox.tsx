import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface SearchBoxProps {
    onSearch: (query: string) => void;
}

const SUGGESTIONS = [
    "Software Engineers in SF working at Series B companies, skilled in Python and Node.js",
    "Marketing Manager in Europe, German-speaking, working at a large enterprise",
    "Senior Scientist in Australia, 8+ years experience",
    "Consultant in London with 2+ years experience at top consulting firms",
    "Sales Manager in Dallas with experience in ERP"
];

import { analysisApi, type TagStatus } from '../../api/analysis';

// ... (imports remain same)

// ... (SUGGESTIONS remain same)

// Remove DEFAULT_TAGS constant as we'll fetch from API or use initial state
const INITIAL_TAGS: TagStatus[] = [
    { label: "Location", containsCriteria: false },
    { label: "Job Title", containsCriteria: false },
    { label: "Years of Experience", containsCriteria: false },
    { label: "Industry", containsCriteria: false },
    { label: "Skills", containsCriteria: false }
];

export const SearchBox = ({ onSearch }: SearchBoxProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [tags, setTags] = useState<TagStatus[]>(INITIAL_TAGS);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Real API call to analyze query
    useEffect(() => {
        const analyzeQuery = async (text: string) => {
            if (!text.trim()) {
                setTags(INITIAL_TAGS);
                return;
            }

            try {
                const newTags = await analysisApi.checkCriteria(text);
                setTags(newTags);
            } catch (error) {
                console.error('Failed to analyze query:', error);
                // Fallback to initial tags on error
                setTags(INITIAL_TAGS);
            }
        };

        const timeoutId = setTimeout(() => {
            analyzeQuery(query);
        }, 300); // Debounce

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.trim()) {
            onSearch(query);
            setIsOpen(false);
        }
    };

    return (
        <div className="relative w-full max-w-3xl mx-auto" ref={containerRef}>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                </div>
                <form onSubmit={handleSubmit}>
                    <Input
                        type="text"
                        className="pl-10 pr-12 py-6 text-lg shadow-lg border-purple-100 focus-visible:ring-purple-500 transition-all"
                        placeholder="Who are you looking for?"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                        <Button
                            size="sm"
                            type="submit"
                            className="h-8 w-8 p-0 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-700"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>
                </form>
            </div>

            {/* Dynamic Tags */}
            <div className="flex flex-wrap gap-2 mt-3 px-1">
                {tags.map((tag, index) => (
                    <div
                        key={index}
                        className={`flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors duration-300 ${tag.containsCriteria
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-white border-gray-200 text-gray-400'
                            }`}
                    >
                        <Check className={`h-3.5 w-3.5 mr-1.5 ${tag.containsCriteria ? 'text-green-600' : 'text-gray-300'}`} />
                        {tag.label}
                    </div>
                ))}
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Suggestions
                        </div>
                        {SUGGESTIONS.map((suggestion, index) => (
                            <button
                                key={index}
                                className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-center group"
                                onClick={() => {
                                    setQuery(suggestion);
                                    onSearch(suggestion);
                                    setIsOpen(false);
                                }}
                            >
                                <Search className="h-4 w-4 text-gray-400 mr-3 group-hover:text-purple-500" />
                                <span className="text-gray-700 group-hover:text-gray-900">{suggestion}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
