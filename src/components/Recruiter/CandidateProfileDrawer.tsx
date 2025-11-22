import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { motion } from 'framer-motion';
import {
    Linkedin, Github, Mail, Phone, ExternalLink, MapPin,
    Building2, GraduationCap, Download,
    Briefcase, Code2, Award, BookOpen, DollarSign, Zap, FileText, X, Loader2, Bot
} from 'lucide-react';
import { applicationsApi } from '../../api/applications';
import { searchApi } from '../../api/search';
import { EmailSequenceEditor } from './EmailSequenceEditor';

interface CandidateProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: any; // Using any for flexibility with the complex JSON structure, but should be typed ideally
    fromRecruiterPage?: boolean; // Flag to indicate if coming from recruiter page
    searchId?: string; // Search ID for recruiter page reject API
    isRejected?: boolean; // Whether this candidate is rejected
}

export const CandidateProfileDrawer: React.FC<CandidateProfileDrawerProps> = ({
    isOpen,
    onClose,
    candidate,
    fromRecruiterPage = false,
    searchId,
    isRejected = false
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'experience' | 'education' | 'projects' | 'skills'>('overview');
    const [isDownloadingResume, setIsDownloadingResume] = useState(false);
    const [isEmailEditorOpen, setIsEmailEditorOpen] = useState(false);
    const [isApprovingForSequence, setIsApprovingForSequence] = useState(false);
    const [emailPrefillData, setEmailPrefillData] = useState<{ subject?: string; content?: string } | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Handle scroll tracking on the parent scroll container
    useEffect(() => {
        if (!isOpen || !scrollContainerRef.current) return;

        // Find the parent scroll container (Drawer's content wrapper)
        const findScrollContainer = (element: HTMLElement | null): HTMLElement | null => {
            if (!element) return null;
            const parent = element.parentElement;
            if (!parent) return null;
            const style = window.getComputedStyle(parent);
            if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                return parent;
            }
            return findScrollContainer(parent);
        };

        const scrollContainer = findScrollContainer(scrollContainerRef.current);
        if (!scrollContainer) return;

        const handleScroll = () => {
            const sections = tabs.map(tab => document.getElementById(tab.id));
            const containerRect = scrollContainer.getBoundingClientRect();
            const tabsHeight = 60; // Height of sticky tabs
            let currentSection = tabs[0].id;

            for (const section of sections) {
                if (!section) continue;
                const rect = section.getBoundingClientRect();
                const offset = rect.top - containerRect.top - tabsHeight;
                // Section is active if it's at or above the tabs position
                if (offset <= 20) {
                    currentSection = section.id;
                }
            }

            if (currentSection !== activeTab) {
                setActiveTab(currentSection as any);
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [isOpen, activeTab]);

    if (!candidate) return null;

    // Extract userId for resume download
    const userId = candidate.userId || candidate.id || candidate._id || candidate.candidate?.userId || candidate.candidate?.id || '';
    // Extract applicationId for approve-level1
    const applicationId = candidate.id || candidate.applicationId || candidate._id || '';

    const parsedResume = candidate.parsedResume || candidate.candidate?.parsedResume || {};
    const contact = parsedResume.contact || {};
    const experience = parsedResume.experience || [];
    const education = parsedResume.education || [];
    const projects = parsedResume.projects || [];
    const skills = parsedResume.skills || {};

    // Extract candidate name from multiple possible locations
    const candidateName = candidate.name || candidate.candidateName || candidate.candidate?.name || contact.name || parsedResume.name || 'Candidate';

    const scores = candidate.scores || {};
    const unifiedScore = scores.unifiedScore ?? candidate.matchScore ?? candidate.alignmentScore ?? null;
    const resumeScore = scores.resumeScore ?? candidate.resumeScore ?? null;
    const githubScore = scores.githubPortfolioScore ?? null;
    const compensationScore = scores.compensationScore ?? null;
    const aiToolsCompatibilityScore = scores.aiToolsCompatibilityScore ?? null;
    const compensationAnalysis = scores.compensationAnalysis;

    const scoreItems = [
        {
            id: 'unified',
            label: 'Overall Match',
            value: unifiedScore,
            icon: Zap,
            color: 'text-purple-600',
            bg: 'bg-purple-100',
            barColor: 'text-purple-600',
            description: 'Combined score based on all factors'
        },
        {
            id: 'resume',
            label: 'Resume Score',
            value: resumeScore,
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            barColor: 'text-blue-600',
            description: 'Based on skills and experience match'
        },
        {
            id: 'github',
            label: 'GitHub / Portfolio',
            value: githubScore,
            icon: Github,
            color: 'text-foreground',
            bg: 'bg-muted',
            barColor: 'text-foreground',
            description: 'Code quality and project impact'
        },
        {
            id: 'compensation',
            label: 'Compensation',
            value: compensationScore,
            icon: DollarSign,
            color: 'text-green-600',
            bg: 'bg-green-100',
            barColor: 'text-green-600',
            description: compensationAnalysis || 'Salary expectation alignment'
        },
        {
            id: 'ai-tools',
            label: 'AI Tools Match',
            value: aiToolsCompatibilityScore,
            icon: Bot,
            color: 'text-indigo-600',
            bg: 'bg-indigo-100',
            barColor: 'text-indigo-600',
            description: 'Familiarity with required AI tools'
        }
    ].filter(item => item.value !== undefined && item.value !== null || item.value === null); // Keep nulls for NA handling

    const socialLinks = {
        linkedin: contact.linkedin || candidate.candidate?.linkedin || candidate.socialLinks?.linkedin,
        github: contact.github || candidate.candidate?.github || candidate.socialLinks?.github,
        portfolio: contact.portfolio || candidate.candidate?.portfolio || candidate.socialLinks?.portfolio,
        email: contact.email || candidate.email,
        phone: contact.phone || candidate.phone
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BookOpen },
        { id: 'experience', label: 'Experience', icon: Briefcase },
        { id: 'education', label: 'Education', icon: GraduationCap },
        { id: 'projects', label: 'Projects', icon: Code2 },
        { id: 'skills', label: 'Skills', icon: Award },
    ];

    const handleDownloadResume = async () => {
        if (!userId) {
            console.error('No userId found for resume download', candidate);
            alert('Unable to download resume: User ID not found');
            return;
        }

        setIsDownloadingResume(true);
        try {
            const blob = await applicationsApi.downloadResume(userId);

            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Determine filename
            const candidateName = candidate.name || candidate.candidateName || 'Candidate';
            const filename = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
            link.download = filename;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download resume:', error);
            alert(error instanceof Error ? error.message : 'Failed to download resume. Please try again.');
        } finally {
            setIsDownloadingResume(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        try {
            if (fromRecruiterPage) {
                // From recruiter page - call search reject API
                if (!searchId) {
                    alert('Search ID not found. Unable to reject candidate.');
                    return;
                }
                if (!userId) {
                    alert('User ID not found. Unable to reject candidate.');
                    return;
                }
                await searchApi.rejectUser(searchId, userId);
                alert('Candidate rejected successfully.');
            } else {
                // From application page - call application reject API
                if (!applicationId) {
                    alert('Application ID not found. Unable to reject candidate.');
                    return;
                }
                await applicationsApi.reject(applicationId);
                alert('Application rejected successfully.');
            }
            onClose(); // Close drawer after rejection
        } catch (error) {
            console.error('Failed to reject:', error);
            alert(error instanceof Error ? error.message : 'Failed to reject candidate. Please try again.');
        } finally {
            setIsRejecting(false);
        }
    };

    const handleOpenEmailSequence = async () => {
        // Reset email prefill data
        setEmailPrefillData(null);

        // Only call approve-level1 API if NOT coming from recruiter page
        if (!fromRecruiterPage) {
            if (!applicationId) {
                alert('Unable to start email sequence: Application ID not found');
                return;
            }

            setIsApprovingForSequence(true);
            try {
                // Call approve-level1 API first
                const response = await applicationsApi.approveLevel1(applicationId);

                // Check if response contains emailData for prefilling
                if (response && typeof response === 'object' && 'emailData' in response) {
                    const emailData = (response as any).emailData;
                    console.log('EmailData received:', emailData);
                    if (emailData) {
                        // Use text content if available, otherwise fall back to html
                        const content = emailData.text || emailData.html || '';
                        console.log('Setting prefill data - Subject:', emailData.subject, 'Content length:', content.length);

                        // Set prefill data first
                        setEmailPrefillData({
                            subject: emailData.subject || '',
                            content: content
                        });

                        // Use setTimeout to ensure state is updated before opening editor
                        setTimeout(() => {
                            setIsEmailEditorOpen(true);
                        }, 0);
                    } else {
                        // No emailData, open editor without prefill
                        setIsEmailEditorOpen(true);
                    }
                } else {
                    console.log('No emailData found in response:', response);
                    // No emailData, open editor without prefill
                    setIsEmailEditorOpen(true);
                }
            } catch (error) {
                console.error('Failed to approve application:', error);
                alert(error instanceof Error ? error.message : 'Failed to approve application. Please try again.');
            } finally {
                setIsApprovingForSequence(false);
            }
        } else {
            // From recruiter page - just open the email editor without prefilling
            setIsEmailEditorOpen(true);
        }
    };

    return (
        <>
            <Drawer isOpen={isOpen} onClose={onClose} title="Candidate Profile" width="max-w-[60%]">
                <div className="flex flex-col">
                    {/* Profile Header */}
                    <div className="px-8 py-6 bg-card border-b border-border flex-shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-5">
                                <div className="h-16 w-16 rounded-2xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300 text-2xl font-bold flex-shrink-0">
                                    {candidateName.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-2xl font-bold text-foreground truncate">{candidateName}</h1>
                                    <p className="text-muted-foreground font-medium truncate text-base mt-0.5">
                                            {candidate.role || experience[0]?.title || 'Candidate'}
                                        </p>
                                        {(candidate.location || experience[0]?.location) && (
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-0.5">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {candidate.location || experience[0]?.location}
                                            </div>
                                        )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {isRejected ? (
                                    <div className="h-9 px-4 flex items-center gap-1.5 text-sm font-medium bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-full">
                                        <X className="h-4 w-4" />
                                        Rejected
                                    </div>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 px-4 gap-2 rounded-full text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-300 hover:border-red-300 dark:hover:border-red-700 transition-colors font-medium"
                                            onClick={handleReject}
                                            disabled={isRejecting || (fromRecruiterPage && !searchId) || (!fromRecruiterPage && !applicationId)}
                                        >
                                            {isRejecting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Rejecting...
                                                </>
                                            ) : (
                                                <>
                                                    <X className="h-4 w-4" />
                                                    Not Suitable
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-9 px-5 gap-2 rounded-full bg-primary hover:bg-primary/90 text-white border-transparent shadow-sm transition-all hover:shadow-md font-medium"
                                            onClick={handleOpenEmailSequence}
                                            disabled={isApprovingForSequence || !applicationId}
                                        >
                                            {isApprovingForSequence ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Approving...
                                                </>
                                            ) : (
                                                <>
                                                    <Mail className="h-4 w-4" />
                                                    Sequence
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}
                                <Button
                                    size="sm"
                                    className="h-9 px-5 gap-2 rounded-lg bg-[#111827] dark:bg-gray-800 text-white hover:bg-gray-800 dark:hover:bg-gray-700 shadow-sm font-medium"
                                    onClick={handleDownloadResume}
                                    disabled={isDownloadingResume || !userId}
                                >
                                    {isDownloadingResume ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4" />
                                            Resume
                                        </>
                                    )}
                                </Button>
                        </div>
                    </div>

                    {/* Social Links */}
                        <div className="flex flex-wrap gap-3 mt-4">
                        {socialLinks.email && (
                            <a href={`mailto:${socialLinks.email}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors">
                                <Mail className="h-3.5 w-3.5" />
                                {socialLinks.email}
                            </a>
                        )}
                        {socialLinks.phone && (
                            <a href={`tel:${socialLinks.phone}`} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors">
                                <Phone className="h-3.5 w-3.5" />
                                {socialLinks.phone}
                            </a>
                        )}
                        {socialLinks.linkedin && (
                            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-sm hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors">
                                <Linkedin className="h-3.5 w-3.5" />
                                LinkedIn
                            </a>
                        )}
                        {socialLinks.github && (
                            <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">
                                <Github className="h-3.5 w-3.5" />
                                GitHub
                            </a>
                        )}
                        {socialLinks.portfolio && (
                            <a href={socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-sm hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-black to-purple-600 dark:from-white dark:to-purple-400">Portfolio</span>
                            </a>
                        )}
                    </div>
                </div>

                    {/* Tabs Navigation */}
                <div className="sticky top-0 z-30 bg-card border-b border-border shadow-sm">
                    <div className="px-8">
                        <div className="flex gap-6 overflow-x-auto no-scrollbar">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab.id as any);
                                            
                                            // Use setTimeout to ensure DOM is updated and tab state is set
                                            setTimeout(() => {
                                                const element = document.getElementById(tab.id);
                                                if (element && scrollContainerRef.current) {
                                                    // Find the parent scroll container (Drawer's content wrapper)
                                                    const findScrollContainer = (el: HTMLElement | null): HTMLElement | null => {
                                                        if (!el) return null;
                                                        const parent = el.parentElement;
                                                        if (!parent) return null;
                                                        const style = window.getComputedStyle(parent);
                                                        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
                                                            return parent;
                                                        }
                                                        return findScrollContainer(parent);
                                                    };

                                                    const scrollContainer = findScrollContainer(scrollContainerRef.current);
                                                    if (scrollContainer) {
                                                        const tabsHeight = 60; // Height of sticky tabs
                                                        const elementRect = element.getBoundingClientRect();
                                                        const containerRect = scrollContainer.getBoundingClientRect();
                                                        
                                                        // Calculate scroll position: element top relative to container minus tabs height
                                                        const scrollTop = scrollContainer.scrollTop;
                                                        const elementTopRelativeToContainer = elementRect.top - containerRect.top + scrollTop;
                                                        const targetScrollTop = elementTopRelativeToContainer - tabsHeight;
                                                        
                                                        scrollContainer.scrollTo({
                                                            top: Math.max(0, targetScrollTop),
                                                            behavior: 'smooth'
                                                        });
                                                    } else {
                                                        // Fallback to scrollIntoView if container not found
                                                        element.scrollIntoView({ 
                                                            behavior: 'smooth', 
                                                            block: 'start',
                                                            inline: 'nearest'
                                                        });
                                                    }
                                                }
                                            }, 10);
                                        }}
                                        className={`
                                        flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                        ${isActive
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-muted-foreground hover:text-primary hover:border-primary/30'}
                                    `}
                                >
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                        </div>
                    </div>
                </div>

                    {/* Scrollable Content */}
                    <div
                    ref={scrollContainerRef}
                        id="scroll-container"
                    className="flex-1 p-8 bg-muted/30"
                    >
                        <div className="space-y-12 pb-20">
                            {/* Overview Section */}
                        <div id="overview" className="scroll-mt-20 space-y-8">
                                {/* Premium Scores Section */}
                                <section>
                                <h3 className="text-lg font-semibold text-foreground mb-4">Match Analysis</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {scoreItems.map((item, index) => {
                                            const isNA = item.value === null || item.value === undefined;
                                            const scoreValue = isNA ? 0 : Math.round(item.value);
                                            const circumference = 2 * Math.PI * 24; // radius 24

                                            return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1, duration: 0.4 }}
                                                    className="bg-card rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center gap-4 overflow-hidden">
                                                        <div className={`p-3 rounded-xl ${item.bg} ${item.color} flex-shrink-0`}>
                                                            <item.icon className="h-6 w-6" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-base font-semibold text-foreground truncate">{item.label}</p>
                                                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                                                    </div>
                                                    </div>

                                                    <div className="relative h-16 w-16 flex items-center justify-center flex-shrink-0">
                                                        {/* Background Circle */}
                                                        <svg className="h-full w-full" viewBox="0 0 64 64">
                                                            <circle
                                                                cx="32"
                                                                cy="32"
                                                                r="24"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                fill="transparent"
                                                                className="text-muted"
                                                            />
                                                            {/* Progress Circle */}
                                                            {!isNA && (
                                                                <motion.circle
                                                                    cx="32"
                                                                    cy="32"
                                                                    r="24"
                                                                    stroke="currentColor"
                                                                    strokeWidth="4"
                                                                    fill="transparent"
                                                                    className={item.barColor}
                                                                    strokeDasharray={circumference}
                                                                    initial={{ strokeDashoffset: circumference }}
                                                                    animate={{ strokeDashoffset: circumference - (scoreValue / 100) * circumference }}
                                                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 + (index * 0.1) }}
                                                                    strokeLinecap="round"
                                                                    transform="rotate(-90 32 32)"
                                                                />
                                                            )}
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <span className={`text-sm font-bold ${isNA ? 'text-muted-foreground' : item.color}`}>
                                                                {isNA ? 'NA' : `${scoreValue}%`}
                                                </span>
                                            </div>
                                            </div>
                                        </motion.div>
                                            );
                                        })}
                                </div>
                            </section>

                            {/* Summary */}
                            <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Professional Summary</h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {parsedResume.resumeSummary || parsedResume.profile || candidate.bio || 'No summary provided.'}
                                </p>
                            </section>

                            {/* Key Highlights */}
                            {candidate.topReasons && candidate.topReasons.length > 0 && (
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <h3 className="text-lg font-semibold text-foreground mb-4">Why they're a match</h3>
                                    <ul className="space-y-3">
                                        {candidate.topReasons.map((reason: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-foreground">
                                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                                {reason}
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}
                        </div>

                        {/* Experience Section */}
                        <div id="experience" className="scroll-mt-20 space-y-6">
                            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-muted-foreground" />
                                Experience
                            </h3>
                            {experience.length > 0 ? (
                                experience.map((role: any, i: number) => (
                                    <div key={i} className="bg-card rounded-xl p-6 shadow-sm border border-border relative">
                                        {/* Timeline connector */}
                                        {i !== experience.length - 1 && (
                                            <div className="absolute left-10 top-20 bottom-0 w-0.5 bg-border" />
                                            )}

                                            <div className="flex gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                    <Building2 className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                        <h3 className="text-lg font-semibold text-foreground">{role.title}</h3>
                                                        <p className="font-medium"><span className="bg-clip-text text-transparent bg-gradient-to-r from-black to-purple-600 dark:from-white dark:to-purple-400">{role.company}</span></p>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                                        {role.duration}
                                                    </span>
                                                </div>
                                                {role.location && (
                                                    <p className="text-sm text-muted-foreground mt-1">{role.location}</p>
                                                )}
                                                {role.description && (
                                                    <p className="text-muted-foreground mt-3 whitespace-pre-line">{role.description}</p>
                                                )}
                                                {role.responsibilities && role.responsibilities.length > 0 && (
                                                    <ul className="mt-3 space-y-1">
                                                        {role.responsibilities.map((resp: string, j: number) => (
                                                            <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                                                <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground flex-shrink-0" />
                                                                {resp}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">No experience listed</div>
                            )}
                        </div>

                        {/* Education Section */}
                        <div id="education" className="scroll-mt-20 space-y-6">
                            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-muted-foreground" />
                                Education
                            </h3>
                            {education.length > 0 ? (
                                education.map((edu: any, i: number) => (
                                    <div key={i} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                        <div className="flex gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-orange-50 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 flex-shrink-0">
                                                <GraduationCap className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-foreground">{edu.institution}</h3>
                                                        <p className="text-foreground font-medium">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                                                        {edu.duration}
                                                    </span>
                                                </div>
                                                {edu.gpa && (
                                                    <p className="text-sm text-muted-foreground mt-2">GPA: {edu.gpa}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">No education listed</div>
                            )}
                        </div>

                        {/* Projects Section */}
                        <div id="projects" className="scroll-mt-20 space-y-6">
                            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <Code2 className="h-5 w-5 text-muted-foreground" />
                                Projects
                            </h3>
                            {projects.length > 0 ? (
                                projects.map((project: any, i: number) => (
                                    <div key={i} className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                                            {project.links && project.links.length > 0 && (
                                                <div className="flex gap-2">
                                                    {project.links.map((link: string, j: number) => (
                                                        <a key={j} href={link} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 transition-colors">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {project.description && (
                                            <p className="text-muted-foreground mb-3 whitespace-pre-line">{project.description}</p>
                                        )}
                                        {project.technologies && project.technologies.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {project.technologies.map((tech: string, j: number) => (
                                                    <span key={j} className="px-2 py-1 rounded bg-primary/10 dark:bg-primary/20 text-xs font-medium">
                                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-black to-purple-600 dark:from-white dark:to-purple-400">{tech}</span>
                                                    </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">No projects listed</div>
                                )}
                            </div>

                            {/* Skills Section */}
                        <div id="skills" className="scroll-mt-20 space-y-6">
                            <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                                <Award className="h-5 w-5 text-muted-foreground" />
                                    Skills
                                </h3>
                            <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="space-y-8">
                                        {Object.entries(skills).map(([category, items]: [string, any]) => {
                                            if (!items || items.length === 0) return null;
                                            return (
                                                <div key={category}>
                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                                        {category.replace(/([A-Z])/g, ' $1').trim()}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {items.map((skill: string, i: number) => (
                                                        <span key={i} className="px-3 py-1.5 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary text-sm font-medium border border-primary/20 dark:border-primary/30">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {candidate.tags && (
                                            <div>
                                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                                    Other Tags
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {candidate.tags.map((tag: string, i: number) => (
                                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-medium">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
            <EmailSequenceEditor
                isOpen={isEmailEditorOpen}
                onClose={() => {
                    setIsEmailEditorOpen(false);
                    setEmailPrefillData(null); // Reset prefill data when closing
                }}
                candidateId={userId}
                screeningId={candidate.screeningId || candidate.screening?.id || candidate.applicationId || candidate.id || ''}
                initialSubject={emailPrefillData?.subject}
                initialContent={emailPrefillData?.content}
            />
        </>
    );
};
