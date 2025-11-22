import { useState } from 'react';
import type React from 'react';
import { Linkedin, Mail, Phone, Github, Eye, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import type { CandidateProfile as CandidateProfileType } from '../../api/search';

interface CandidateProfileProps {
    candidate: CandidateProfileType;
    onShortlist?: (id: string) => void;
    onView?: (id: string) => void;
    query?: string;
}

// Helper function to highlight keywords in text
const highlightKeywords = (text: string, keywords: string[] = [], query: string = ''): React.ReactNode => {
    if (!text) return text;
    
    // Combine keywords and query terms
    const allTerms = [...keywords, ...(query ? query.split(/\s+/) : [])].filter(Boolean);
    if (allTerms.length === 0) return text;
    
    // Create regex pattern for all terms
    const pattern = new RegExp(`(${allTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    
    const parts = text.split(pattern);
    return parts.map((part, index) => {
        if (allTerms.some(term => part.toLowerCase() === term.toLowerCase())) {
            return (
                <mark key={index} className="bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary px-1 rounded">
                    {part}
                </mark>
            );
        }
        return <span key={index}>{part}</span>;
    });
};

// Get company logo placeholder (first letter)
const getLogoPlaceholder = (text: string) => {
    return text.charAt(0).toUpperCase();
};

export const CandidateProfile = ({ candidate, onShortlist, onView, query }: CandidateProfileProps) => {
    const [isSelected, setIsSelected] = useState(false);
    
    // Handle different field names from API
    const candidateName = candidate.name || candidate.fullName || 'Unknown';
    const candidateId = candidate.id || candidate._id || '';
    const portfolioUrl = candidate.portfolio || candidate.website || candidate.linkedin || candidate.github;

    return (
        <div className="border-b border-gray-200 py-6 first:pt-0 last:border-b-0">
            <div className="flex items-start gap-4">
                {/* Checkbox */}
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => setIsSelected(e.target.checked)}
                    className="mt-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />

                {/* Main Content */}
                <div className="flex-1 space-y-3">
                    {/* Header with name and social links */}
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-xl font-bold text-gray-900">{candidateName}</h3>
                            
                            {/* Social Links */}
                            <div className="flex items-center gap-2">
                                {portfolioUrl && (
                                    <a
                                        href={portfolioUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-4 w-4 rounded bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white"
                                        aria-label="Portfolio"
                                    >
                                        <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                )}
                                {candidate.linkedin && (
                                    <a
                                        href={candidate.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700"
                                        aria-label="LinkedIn"
                                    >
                                        <Linkedin className="h-4 w-4" />
                                    </a>
                                )}
                                {candidate.email && (
                                    <a
                                        href={`mailto:${candidate.email}`}
                                        className="text-gray-600 hover:text-gray-700"
                                        aria-label="Email"
                                    >
                                        <Mail className="h-4 w-4" />
                                    </a>
                                )}
                                {candidate.phone && (
                                    <a
                                        href={`tel:${candidate.phone}`}
                                        className="text-gray-600 hover:text-gray-700"
                                        aria-label="Phone"
                                    >
                                        <Phone className="h-4 w-4" />
                                    </a>
                                )}
                                {candidate.github && (
                                    <a
                                        href={candidate.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-800 hover:text-gray-900"
                                        aria-label="GitHub"
                                    >
                                        <Github className="h-4 w-4" />
                                    </a>
                                )}
                                {candidate.stackoverflow && (
                                    <a
                                        href={candidate.stackoverflow}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-orange-600 hover:text-orange-700"
                                        aria-label="Stack Overflow"
                                    >
                                        <span className="text-xs font-bold">Q</span>
                                    </a>
                                )}
                                {candidate.devto && (
                                    <a
                                        href={candidate.devto}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-800 hover:text-gray-900"
                                        aria-label="Dev.to"
                                    >
                                        <span className="text-xs font-bold">DEV</span>
                                    </a>
                                )}
                                {candidate.twitter && (
                                    <a
                                        href={candidate.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-800 hover:text-gray-900"
                                        aria-label="Twitter"
                                    >
                                        <span className="text-xs font-bold">X</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onShortlist?.(candidateId)}
                                className="flex items-center gap-1"
                            >
                                Shortlist
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onView?.(candidateId)}
                                className="h-8 w-8"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Current Role */}
                    {(candidate.currentRole?.title || candidate.currentRole?.position) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            {candidate.currentRole.companyLogo ? (
                                <img
                                    src={candidate.currentRole.companyLogo}
                                    alt={candidate.currentRole.company || candidate.currentRole.companyName || ''}
                                    className="h-5 w-5 rounded-full"
                                />
                            ) : (
                                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                                    {getLogoPlaceholder(candidate.currentRole.company || candidate.currentRole.companyName || '')}
                                </div>
                            )}
                            <span>
                                <span className="font-medium">{candidate.currentRole.title || candidate.currentRole.position}</span>
                                {' at '}
                                <span className="font-medium">{candidate.currentRole.company || candidate.currentRole.companyName}</span>
                                {(candidate.currentRole.location || candidate.currentRole.city) && 
                                    ` • ${candidate.currentRole.location || 
                                        [candidate.currentRole.city, candidate.currentRole.state, candidate.currentRole.country]
                                            .filter(Boolean).join(', ')}`}
                            </span>
                        </div>
                    )}

                    {/* Education */}
                    {(candidate.education?.degree || candidate.education?.field) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            {candidate.education.universityLogo ? (
                                <img
                                    src={candidate.education.universityLogo}
                                    alt={candidate.education.university || candidate.education.universityName || ''}
                                    className="h-5 w-5 rounded-full"
                                />
                            ) : (
                                <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold">
                                    {getLogoPlaceholder(candidate.education.university || candidate.education.universityName || '')}
                                </div>
                            )}
                            <span>
                                {candidate.education.degree && (
                                    <>
                                        <span className="font-medium">{candidate.education.degree}</span>
                                        {', '}
                                    </>
                                )}
                                <span>{candidate.education.field || candidate.education.major}</span>
                                {' at '}
                                <span className="font-medium">{candidate.education.university || candidate.education.universityName}</span>
                            </span>
                        </div>
                    )}

                    {/* Bio with highlighted keywords */}
                    {(candidate.bio || candidate.summary || candidate.description) && (
                        <div className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-purple-600 mt-0.5">★</span>
                            <p className="leading-relaxed">
                                {highlightKeywords(
                                    candidate.bio || candidate.summary || candidate.description || '', 
                                    candidate.highlightedKeywords, 
                                    query
                                )}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

