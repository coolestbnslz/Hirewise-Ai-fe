import React, { useState } from 'react';
import { type Application } from '../../api/applications';
import { Card, CardContent } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { CandidateCard } from '../../components/Recruiter/CandidateCard';
import { Loader2, History, Users, CheckCircle, XCircle, Play, RefreshCw } from 'lucide-react';
import { SearchBox } from '../../components/Recruiter/SearchBox';
import { ResultSummary } from '../../components/Recruiter/ResultSummary';
import { FilterDrawer } from '../../components/Recruiter/FilterDrawer';
import { searchApi, type CandidateProfile, type PastSearch, type SearchDetails } from '../../api/search';
import { ResultsHeader } from '../../components/Recruiter/ResultsHeader';
import { CandidateProfileDrawer } from '../../components/Recruiter/CandidateProfileDrawer';
import { Button } from '../../components/ui/Button';

const RecruiterDashboard = () => {
    // const [applications, setApplications] = useState<Application[]>([]);
    // const [isLoading, setIsLoading] = useState(true);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);

    // Search State
    const [hasSearched, setHasSearched] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<CandidateProfile[]>([]);
    const [matchCount, setMatchCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(15);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [filters, setFilters] = useState({
        jobTitle: '',
        location: '',
        experience: '',
        skills: [] as string[]
    });


    const handleSearch = async (query: string, page: number = 1) => {
        setSearchQuery(query);
        setHasSearched(true);
        setIsSearching(true);
        setCurrentPage(page);
        setIsPastSearchesOpen(false); // Hide past searches when performing a new search

        try {
            // Call the search API
            const response = await searchApi.search(query, page, pageSize);

            // Log the response for debugging
            console.log('Search API Response:', response);

            // Handle different response structures
            // Check if response is an array directly
            let candidates: CandidateProfile[] = [];
            let total = 0;

            if (Array.isArray(response)) {
                // Response is directly an array
                candidates = response;
                total = response.length;
            } else if (response.candidates) {
                candidates = Array.isArray(response.candidates) ? response.candidates : [];
                total = response.total || response.totalMatches || response.count || candidates.length;
            } else if (response.users) {
                candidates = Array.isArray(response.users) ? response.users : [];
                total = response.total || response.totalMatches || response.count || candidates.length;
            } else if (response.data) {
                // Some APIs wrap data in a 'data' field
                candidates = Array.isArray(response.data) ? response.data : [];
                total = response.total || response.totalMatches || response.count || candidates.length;
            } else {
                // Try to find any array field in the response
                const responseKeys = Object.keys(response);
                const arrayKey = responseKeys.find(key => Array.isArray((response as any)[key]));
                if (arrayKey) {
                    candidates = (response as any)[arrayKey];
                    total = response.total || response.totalMatches || response.count || candidates.length;
                }
            }

            console.log('Parsed candidates:', candidates);
            console.log('Total count:', total);

            // Update search results
            setSearchResults(candidates);
            setMatchCount(total);

            // Update filters from API response if provided
            if ('filters' in response && response.filters) {
                setFilters({
                    jobTitle: response.filters.jobTitle || '',
                    location: response.filters.location || '',
                    experience: response.filters.experience || '',
                    skills: response.filters.skills || []
                });
            } else {
                // Fallback: parse query to auto-populate filters
                if (query.toLowerCase().includes('software engineer')) {
                    setFilters(prev => ({ ...prev, jobTitle: 'Software Engineer', skills: ['Python', 'Node.js'] }));
                } else if (query.toLowerCase().includes('marketing')) {
                    setFilters(prev => ({ ...prev, jobTitle: 'Marketing Manager', location: 'Europe' }));
                }
            }
        } catch (error: any) {
            console.error('Search failed:', error);
            console.error('Error details:', {
                message: error?.message,
                stack: error?.stack,
                response: error?.response
            });

            // On error, show empty results
            setSearchResults([]);
            setMatchCount(0);

            // Show user-friendly error message
            if (error?.message) {
                alert(`Search error: ${error.message}. Please check the console for more details.`);
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleUpdateFilters = (newFilters: any) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setIsFilterDrawerOpen(false);
        // Re-run search with updated filters
        if (hasSearched && searchQuery) {
            handleSearch(searchQuery);
        }
    };

    const handleRunSearch = () => {
        if (searchQuery) {
            handleSearch(searchQuery, currentPage);
        }
    };

    const handlePageChange = (page: number) => {
        if (searchQuery) {
            handleSearch(searchQuery, page);
        }
    };

    const [selectedCandidateForDrawer, setSelectedCandidateForDrawer] = useState<CandidateProfile | null>(null);
    const [currentSearchIdForDrawer, setCurrentSearchIdForDrawer] = useState<string | null>(null);
    const [isCandidateRejected, setIsCandidateRejected] = useState<boolean>(false);

    // Past Searches State
    const [isPastSearchesOpen, setIsPastSearchesOpen] = useState(false);
    const [pastSearches, setPastSearches] = useState<PastSearch[]>([]);
    const [isLoadingPastSearches, setIsLoadingPastSearches] = useState(false);
    const [selectedSearchDetails, setSelectedSearchDetails] = useState<SearchDetails | null>(null);
    const [isLoadingSearchDetails, setIsLoadingSearchDetails] = useState(false);
    const [searchFilter, setSearchFilter] = useState<'all' | 'shortlisted' | 'rejected'>('all');
    const [shortlistedUsers, setShortlistedUsers] = useState<Set<string>>(new Set());
    const [rejectedUsers, setRejectedUsers] = useState<Set<string>>(new Set());
    // Expanded past search state: { searchId: { filterType: 'shortlisted' | 'rejected' | 'all', profiles: CandidateProfile[], isLoading: boolean, shortlistedUsers?: string[], rejectedUsers?: string[] } }
    const [expandedPastSearches, setExpandedPastSearches] = useState<Record<string, { filterType: 'shortlisted' | 'rejected' | 'all', profiles: CandidateProfile[], isLoading: boolean, shortlistedUsers?: string[], rejectedUsers?: string[] }>>({});
    const [refreshingSearchId, setRefreshingSearchId] = useState<string | null>(null);

    const fetchPastSearches = async () => {
        setIsLoadingPastSearches(true);
        try {
            const searches = await searchApi.getPastSearches();
            setPastSearches(searches);
        } catch (error) {
            console.error('Failed to fetch past searches:', error);
            alert('Failed to load past searches. Please try again.');
        } finally {
            setIsLoadingPastSearches(false);
        }
    };

    const handleOpenPastSearches = () => {
        if (!isPastSearchesOpen) {
            fetchPastSearches();
            // Clear search filters and results when showing past searches
            setSearchResults([]);
            setMatchCount(0);
            setHasSearched(false);
            setSearchQuery('');
            setCurrentPage(1);
        }
        setIsPastSearchesOpen(!isPastSearchesOpen);
    };

    const handleRefreshSearch = async (searchId: string, event?: React.MouseEvent) => {
        event?.stopPropagation();
        setRefreshingSearchId(searchId);
        try {
            // Fetch updated search details
            const details = await searchApi.getSearchDetails(searchId);

            // Update the past searches list with updated counts
            setPastSearches(prev => prev.map(search => {
                if ((search.searchId || search.id) === searchId) {
                    return {
                        ...search,
                        shortlistedCount: details.shortlistedCount ?? search.shortlistedCount,
                        rejectedCount: details.rejectedCount ?? search.rejectedCount,
                        totalResults: details.totalResults ?? search.totalResults,
                        totalMatches: details.totalMatches ?? search.totalMatches,
                        updatedAt: details.updatedAt ?? search.updatedAt
                    };
                }
                return search;
            }));

            // Update shortlisted and rejected users sets
            if (details.shortlistedUsers && Array.isArray(details.shortlistedUsers)) {
                setShortlistedUsers(prev => {
                    const newSet = new Set(prev);
                    details.shortlistedUsers!.forEach((id: string) => newSet.add(id));
                    return newSet;
                });
            }
            if (details.rejectedUsers && Array.isArray(details.rejectedUsers)) {
                setRejectedUsers(prev => {
                    const newSet = new Set(prev);
                    details.rejectedUsers!.forEach((id: string) => newSet.add(id));
                    return newSet;
                });
            }

            // If this search is currently expanded, refresh the profiles
            const expandedSearch = expandedPastSearches[searchId];
            if (expandedSearch) {
                // Re-fetch profiles based on current filter type
                const filterType = expandedSearch.filterType;

                try {
                    if (filterType === 'shortlisted') {
                        // Extract userIds from shortlistedUsers array
                        const shortlistedUserIds: string[] = [];
                        if (details.shortlistedUsers && Array.isArray(details.shortlistedUsers)) {
                            details.shortlistedUsers.forEach((user: any) => {
                                if (typeof user === 'string') {
                                    shortlistedUserIds.push(user);
                                } else if (user && (user._id || user.id || user.userId)) {
                                    shortlistedUserIds.push(user._id || user.id || user.userId);
                                }
                            });
                        }

                        // Fetch profiles only for shortlisted user IDs
                        const profilePromises = shortlistedUserIds.map(async (userId) => {
                            try {
                                const profile = await searchApi.getUserProfile(userId);
                                const snapshot = details.resultsSnapshot?.find((s: any) => s.userId === userId);
                                return {
                                    ...profile,
                                    id: profile.id || userId,
                                    _id: profile._id || userId,
                                    matchScore: snapshot?.matchScore,
                                    skillsMatched: snapshot?.skillsMatched,
                                    recommendedAction: snapshot?.recommendedAction,
                                } as CandidateProfile & { matchScore?: number; skillsMatched?: string[]; recommendedAction?: string };
                            } catch (error) {
                                console.error(`Failed to fetch profile for userId ${userId}:`, error);
                                return null;
                            }
                        });

                        const fetchedProfiles = await Promise.all(profilePromises);
                        const shortlistedProfiles = fetchedProfiles.filter((p): p is CandidateProfile => p !== null);

                        setExpandedPastSearches(prev => ({
                            ...prev,
                            [searchId]: {
                                ...prev[searchId],
                                profiles: shortlistedProfiles,
                                shortlistedUsers: shortlistedUserIds,
                                rejectedUsers: []
                            }
                        }));
                    } else if (filterType === 'rejected') {
                        // Extract userIds from rejectedUsers array
                        const rejectedUserIds: string[] = [];
                        if (details.rejectedUsers && Array.isArray(details.rejectedUsers)) {
                            details.rejectedUsers.forEach((user: any) => {
                                if (typeof user === 'string') {
                                    rejectedUserIds.push(user);
                                } else if (user && (user._id || user.id || user.userId)) {
                                    rejectedUserIds.push(user._id || user.id || user.userId);
                                }
                            });
                        }

                        // Fetch profiles only for rejected user IDs
                        const profilePromises = rejectedUserIds.map(async (userId) => {
                            try {
                                const profile = await searchApi.getUserProfile(userId);
                                const snapshot = details.resultsSnapshot?.find((s: any) => s.userId === userId);
                                return {
                                    ...profile,
                                    id: profile.id || userId,
                                    _id: profile._id || userId,
                                    matchScore: snapshot?.matchScore,
                                    skillsMatched: snapshot?.skillsMatched,
                                    recommendedAction: snapshot?.recommendedAction,
                                } as CandidateProfile & { matchScore?: number; skillsMatched?: string[]; recommendedAction?: string };
                            } catch (error) {
                                console.error(`Failed to fetch profile for userId ${userId}:`, error);
                                return null;
                            }
                        });

                        const fetchedProfiles = await Promise.all(profilePromises);
                        const rejectedProfiles = fetchedProfiles.filter((p): p is CandidateProfile => p !== null);

                        setExpandedPastSearches(prev => ({
                            ...prev,
                            [searchId]: {
                                ...prev[searchId],
                                profiles: rejectedProfiles,
                                shortlistedUsers: [],
                                rejectedUsers: rejectedUserIds
                            }
                        }));
                    } else {
                        // For 'all', refresh all profiles
                        let allCandidates: CandidateProfile[] = [];

                        if (details.resultsSnapshot && Array.isArray(details.resultsSnapshot) && details.resultsSnapshot.length > 0) {
                            const profilePromises = details.resultsSnapshot.map(async (snapshot: any) => {
                                try {
                                    const profile = await searchApi.getUserProfile(snapshot.userId);
                                    return {
                                        ...profile,
                                        id: profile.id || snapshot.userId,
                                        _id: profile._id || snapshot._id,
                                        matchScore: snapshot.matchScore,
                                        skillsMatched: snapshot.skillsMatched,
                                        recommendedAction: snapshot.recommendedAction,
                                    } as CandidateProfile & { matchScore?: number; skillsMatched?: string[]; recommendedAction?: string };
                                } catch (error) {
                                    console.error(`Failed to fetch profile for userId ${snapshot.userId}:`, error);
                                    return null;
                                }
                            });

                            const fetchedProfiles = await Promise.all(profilePromises);
                            allCandidates = fetchedProfiles.filter((p): p is CandidateProfile => p !== null);
                        } else {
                            allCandidates = details.users || details.candidates || [];
                        }

                        // Extract userIds from shortlistedUsers and rejectedUsers arrays
                        const shortlistedUserIds: string[] = [];
                        const rejectedUserIds: string[] = [];

                        if (details.shortlistedUsers && Array.isArray(details.shortlistedUsers)) {
                            details.shortlistedUsers.forEach((user: any) => {
                                if (typeof user === 'string') {
                                    shortlistedUserIds.push(user);
                                } else if (user && (user._id || user.id || user.userId)) {
                                    shortlistedUserIds.push(user._id || user.id || user.userId);
                                }
                            });
                        }

                        if (details.rejectedUsers && Array.isArray(details.rejectedUsers)) {
                            details.rejectedUsers.forEach((user: any) => {
                                if (typeof user === 'string') {
                                    rejectedUserIds.push(user);
                                } else if (user && (user._id || user.id || user.userId)) {
                                    rejectedUserIds.push(user._id || user.id || user.userId);
                                }
                            });
                        }

                        setExpandedPastSearches(prev => ({
                            ...prev,
                            [searchId]: {
                                ...prev[searchId],
                                profiles: allCandidates,
                                shortlistedUsers: shortlistedUserIds,
                                rejectedUsers: rejectedUserIds
                            }
                        }));
                    }
                } catch (refreshError) {
                    console.error('Failed to refresh profiles:', refreshError);
                    // Don't throw - we've already updated the counts, which is the main goal
                }
            }
        } catch (error) {
            console.error('Failed to refresh search:', error);
            alert('Failed to refresh search. Please try again.');
        } finally {
            setRefreshingSearchId(null);
        }
    };

    const handleSearchClick = async (searchId: string, filterType: 'all' | 'shortlisted' | 'rejected' = 'all') => {
        setIsLoadingSearchDetails(true);
        setSearchFilter(filterType);
        try {
            const details = await searchApi.getSearchDetails(searchId);
            setSelectedSearchDetails(details);

            // Update shortlisted and rejected users sets from the response
            if (details.shortlistedUsers && Array.isArray(details.shortlistedUsers)) {
                setShortlistedUsers(new Set(details.shortlistedUsers));
            }
            if (details.rejectedUsers && Array.isArray(details.rejectedUsers)) {
                setRejectedUsers(new Set(details.rejectedUsers));
            }

            // Get candidates from resultsSnapshot or existing users/candidates arrays
            let allCandidates: CandidateProfile[] = [];

            if (details.resultsSnapshot && Array.isArray(details.resultsSnapshot) && details.resultsSnapshot.length > 0) {
                // Fetch user profiles for each userId in resultsSnapshot
                const profilePromises = details.resultsSnapshot.map(async (snapshot) => {
                    try {
                        const profile = await searchApi.getUserProfile(snapshot.userId);
                        // Add match score and skills matched from snapshot
                        return {
                            ...profile,
                            id: profile.id || snapshot.userId,
                            _id: profile._id || snapshot._id,
                            matchScore: snapshot.matchScore,
                            skillsMatched: snapshot.skillsMatched,
                            recommendedAction: snapshot.recommendedAction,
                        } as CandidateProfile & { matchScore?: number; skillsMatched?: string[]; recommendedAction?: string };
                    } catch (error) {
                        console.error(`Failed to fetch profile for userId ${snapshot.userId}:`, error);
                        // Return a minimal profile object if fetch fails
                        return {
                            id: snapshot.userId,
                            _id: snapshot._id,
                            matchScore: snapshot.matchScore,
                            skillsMatched: snapshot.skillsMatched,
                            recommendedAction: snapshot.recommendedAction,
                        } as CandidateProfile & { matchScore?: number; skillsMatched?: string[]; recommendedAction?: string };
                    }
                });

                allCandidates = await Promise.all(profilePromises);
            } else {
                // Fallback to existing users/candidates arrays
                allCandidates = details.users || details.candidates || [];
            }

            // Filter based on selection
            let filteredCandidates = allCandidates;
            if (filterType === 'shortlisted') {
                const shortlistedSet = details.shortlistedUsers ? new Set(details.shortlistedUsers) : shortlistedUsers;
                filteredCandidates = allCandidates.filter((candidate: CandidateProfile) =>
                    shortlistedSet.has(candidate.id || candidate._id || '')
                );
            } else if (filterType === 'rejected') {
                const rejectedSet = details.rejectedUsers ? new Set(details.rejectedUsers) : rejectedUsers;
                filteredCandidates = allCandidates.filter((candidate: CandidateProfile) =>
                    rejectedSet.has(candidate.id || candidate._id || '')
                );
            }

            setSearchResults(filteredCandidates);
            setMatchCount(details.totalResults || details.totalMatches || filteredCandidates.length);
            setSearchQuery(details.searchText || details.query || '');
            setHasSearched(true);
            setIsPastSearchesOpen(false);
        } catch (error) {
            console.error('Failed to fetch search details:', error);
            alert('Failed to load search details. Please try again.');
        } finally {
            setIsLoadingSearchDetails(false);
        }
    };

    const handleViewAll = async (searchId: string, event?: React.MouseEvent) => {
        event?.stopPropagation();

        // If already expanded with all, collapse it
        if (expandedPastSearches[searchId]?.filterType === 'all') {
            setExpandedPastSearches(prev => {
                const newState = { ...prev };
                delete newState[searchId];
                return newState;
            });
            return;
        }

        // Set loading state
        setExpandedPastSearches(prev => ({
            ...prev,
            [searchId]: { filterType: 'all', profiles: [], isLoading: true }
        }));

        try {
            const details = await searchApi.getSearchDetails(searchId);

            // Get all candidates from resultsSnapshot
            let allCandidates: CandidateProfile[] = [];

            if (details.resultsSnapshot && Array.isArray(details.resultsSnapshot) && details.resultsSnapshot.length > 0) {
                // Fetch user profiles for each userId in resultsSnapshot
                const profilePromises = details.resultsSnapshot.map(async (snapshot) => {
                    try {
                        const profile = await searchApi.getUserProfile(snapshot.userId);
                        return {
                            ...profile,
                            id: profile.id || snapshot.userId,
                            _id: profile._id || snapshot._id,
                            matchScore: snapshot.matchScore,
                            skillsMatched: snapshot.skillsMatched,
                            recommendedAction: snapshot.recommendedAction,
                        } as CandidateProfile & { matchScore?: number; skillsMatched?: string[]; recommendedAction?: string };
                    } catch (error) {
                        console.error(`Failed to fetch profile for userId ${snapshot.userId}:`, error);
                        return null;
                    }
                });

                const fetchedProfiles = await Promise.all(profilePromises);
                allCandidates = fetchedProfiles.filter((p): p is CandidateProfile => p !== null);
            } else {
                // Fallback to existing users/candidates arrays
                allCandidates = details.users || details.candidates || [];
            }

            // Update shortlisted and rejected users sets from the response
            if (details.shortlistedUsers && Array.isArray(details.shortlistedUsers)) {
                setShortlistedUsers(prev => {
                    const newSet = new Set(prev);
                    details.shortlistedUsers!.forEach((id: string) => newSet.add(id));
                    return newSet;
                });
            }
            if (details.rejectedUsers && Array.isArray(details.rejectedUsers)) {
                setRejectedUsers(prev => {
                    const newSet = new Set(prev);
                    details.rejectedUsers!.forEach((id: string) => newSet.add(id));
                    return newSet;
                });
            }

            // Extract userIds from shortlistedUsers and rejectedUsers arrays
            const shortlistedUserIds: string[] = [];
            const rejectedUserIds: string[] = [];

            if (details.shortlistedUsers && Array.isArray(details.shortlistedUsers)) {
                details.shortlistedUsers.forEach((user: any) => {
                    if (typeof user === 'string') {
                        shortlistedUserIds.push(user);
                    } else if (user && (user._id || user.id || user.userId)) {
                        shortlistedUserIds.push(user._id || user.id || user.userId);
                    }
                });
            }

            if (details.rejectedUsers && Array.isArray(details.rejectedUsers)) {
                details.rejectedUsers.forEach((user: any) => {
                    if (typeof user === 'string') {
                        rejectedUserIds.push(user);
                    } else if (user && (user._id || user.id || user.userId)) {
                        rejectedUserIds.push(user._id || user.id || user.userId);
                    }
                });
            }

            setExpandedPastSearches(prev => ({
                ...prev,
                [searchId]: {
                    filterType: 'all',
                    profiles: allCandidates,
                    isLoading: false,
                    shortlistedUsers: shortlistedUserIds,
                    rejectedUsers: rejectedUserIds
                }
            }));
        } catch (error) {
            console.error('Failed to fetch all profiles:', error);
            setExpandedPastSearches(prev => ({
                ...prev,
                [searchId]: { filterType: 'all', profiles: [], isLoading: false }
            }));
        }
    };

    const handleViewShortlisted = async (searchId: string, event: React.MouseEvent) => {
        event.stopPropagation();

        // If already expanded with shortlisted, collapse it
        if (expandedPastSearches[searchId]?.filterType === 'shortlisted') {
            setExpandedPastSearches(prev => {
                const newState = { ...prev };
                delete newState[searchId];
                return newState;
            });
            return;
        }

        // Set loading state
        setExpandedPastSearches(prev => ({
            ...prev,
            [searchId]: { filterType: 'shortlisted', profiles: [], isLoading: true }
        }));

        try {
            // Call API without status parameter to get full search details
            const details = await searchApi.getSearchDetails(searchId);

            // Extract userIds from shortlistedUsers array (could be objects with _id or just strings)
            const shortlistedUserIds: string[] = [];
            if (details.shortlistedUsers && Array.isArray(details.shortlistedUsers)) {
                details.shortlistedUsers.forEach((user: any) => {
                    if (typeof user === 'string') {
                        shortlistedUserIds.push(user);
                    } else if (user && (user._id || user.id || user.userId)) {
                        shortlistedUserIds.push(user._id || user.id || user.userId);
                    }
                });

                // Update shortlisted users set
                setShortlistedUsers(prev => {
                    const newSet = new Set(prev);
                    shortlistedUserIds.forEach((id: string) => newSet.add(id));
                    return newSet;
                });
            }

            // Fetch profiles only for shortlisted user IDs
            const profilePromises = shortlistedUserIds.map(async (userId) => {
                try {
                    const profile = await searchApi.getUserProfile(userId);
                    // Try to get match score from resultsSnapshot if available
                    const snapshot = details.resultsSnapshot?.find((s: any) => s.userId === userId);
                    return {
                        ...profile,
                        id: profile.id || userId,
                        _id: profile._id || userId,
                        matchScore: snapshot?.matchScore,
                        skillsMatched: snapshot?.skillsMatched,
                        recommendedAction: snapshot?.recommendedAction,
                    } as CandidateProfile & { matchScore?: number; skillsMatched?: string[]; recommendedAction?: string };
                } catch (error) {
                    console.error(`Failed to fetch profile for userId ${userId}:`, error);
                    return null;
                }
            });

            const fetchedProfiles = await Promise.all(profilePromises);
            const shortlistedProfiles = fetchedProfiles.filter((p): p is CandidateProfile => p !== null);

            setExpandedPastSearches(prev => ({
                ...prev,
                [searchId]: {
                    filterType: 'shortlisted',
                    profiles: shortlistedProfiles,
                    isLoading: false,
                    shortlistedUsers: shortlistedUserIds,
                    rejectedUsers: []
                }
            }));
        } catch (error) {
            console.error('Failed to fetch shortlisted profiles:', error);
            setExpandedPastSearches(prev => ({
                ...prev,
                [searchId]: { filterType: 'shortlisted', profiles: [], isLoading: false }
            }));
        }
    };

    const handleViewRejected = async (searchId: string, event: React.MouseEvent) => {
        event.stopPropagation();

        // If already expanded with rejected, collapse it
        if (expandedPastSearches[searchId]?.filterType === 'rejected') {
            setExpandedPastSearches(prev => {
                const newState = { ...prev };
                delete newState[searchId];
                return newState;
            });
            return;
        }

        // Set loading state
        setExpandedPastSearches(prev => ({
            ...prev,
            [searchId]: { filterType: 'rejected', profiles: [], isLoading: true }
        }));

        try {
            // Call API without status parameter to get full search details
            const details = await searchApi.getSearchDetails(searchId);

            // Extract userIds from rejectedUsers array (could be objects with _id or just strings)
            const rejectedUserIds: string[] = [];
            if (details.rejectedUsers && Array.isArray(details.rejectedUsers)) {
                details.rejectedUsers.forEach((user: any) => {
                    if (typeof user === 'string') {
                        rejectedUserIds.push(user);
                    } else if (user && (user._id || user.id || user.userId)) {
                        rejectedUserIds.push(user._id || user.id || user.userId);
                    }
                });

                // Update rejected users set
                setRejectedUsers(prev => {
                    const newSet = new Set(prev);
                    rejectedUserIds.forEach((id: string) => newSet.add(id));
                    return newSet;
                });
            }

            // Fetch profiles only for rejected user IDs
            const profilePromises = rejectedUserIds.map(async (userId) => {
                try {
                    const profile = await searchApi.getUserProfile(userId);
                    // Try to get match score from resultsSnapshot if available
                    const snapshot = details.resultsSnapshot?.find((s: any) => s.userId === userId);
                    return {
                        ...profile,
                        id: profile.id || userId,
                        _id: profile._id || userId,
                        matchScore: snapshot?.matchScore,
                        skillsMatched: snapshot?.skillsMatched,
                        recommendedAction: snapshot?.recommendedAction,
                    } as CandidateProfile & { matchScore?: number; skillsMatched?: string[]; recommendedAction?: string };
                } catch (error) {
                    console.error(`Failed to fetch profile for userId ${userId}:`, error);
                    return null;
                }
            });

            const fetchedProfiles = await Promise.all(profilePromises);
            const rejectedProfiles = fetchedProfiles.filter((p): p is CandidateProfile => p !== null);

            setExpandedPastSearches(prev => ({
                ...prev,
                [searchId]: {
                    filterType: 'rejected',
                    profiles: rejectedProfiles,
                    isLoading: false,
                    shortlistedUsers: [],
                    rejectedUsers: rejectedUserIds
                }
            }));
        } catch (error) {
            console.error('Failed to fetch rejected profiles:', error);
            setExpandedPastSearches(prev => ({
                ...prev,
                [searchId]: { filterType: 'rejected', profiles: [], isLoading: false }
            }));
        }
    };

    const handleShortlistUser = async (searchId: string, userId: string) => {
        try {
            await searchApi.shortlistUser(searchId, userId);
            setShortlistedUsers(prev => new Set(prev).add(userId));
            setRejectedUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
            // Refresh search details if currently viewing this search
            if (selectedSearchDetails?.searchId === searchId || selectedSearchDetails?.id === searchId) {
                await handleSearchClick(searchId, searchFilter);
            }
        } catch (error) {
            console.error('Failed to shortlist user:', error);
            alert('Failed to shortlist user. Please try again.');
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <div className="min-h-screen bg-background/50 -m-6 p-6">
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">

                {!hasSearched ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                        <div className="text-center space-y-4">
                            <div className="h-16 w-16 bg-card rounded-xl shadow-sm border border-border flex items-center justify-center mx-auto mb-6">
                                <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                    <line x1="12" y1="22.08" x2="12" y2="12" />
                                </svg>
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-foreground">PeopleGPT by <span className="bg-clip-text text-transparent bg-gradient-to-r from-black to-purple-600 dark:from-white dark:to-purple-400">HireWiseAI</span></h1>
                            <p className="text-lg text-muted-foreground">Find exactly who you're looking for, in seconds.</p>
                        </div>

                        <div className="w-full max-w-full space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <SearchBox onSearch={handleSearch} />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleOpenPastSearches}
                                    className="gap-2 py-6 px-6 text-base whitespace-nowrap flex-shrink-0 shadow-lg border-border hover:border-primary/30 hover:bg-accent transition-all"
                                >
                                    <History className="h-5 w-5" />
                                    {isPastSearchesOpen ? 'Hide' : 'Show'} Past Searches
                                </Button>
                            </div>

                            {/* Past Searches Cards */}
                            {isPastSearchesOpen && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                        <History className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Search History</h2>
                                    </div>
                                    {isLoadingPastSearches ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : pastSearches.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-border">
                                            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                            <p>No past searches found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {pastSearches.map((search) => (
                                                <React.Fragment key={search.id || search.searchId}>
                                                    <Card
                                                        className="hover:shadow-lg transition-all border-2 border-border bg-card"
                                                    >
                                                        <CardContent className="p-6">
                                                            <div className="space-y-4">
                                                                {/* Header Section */}
                                                                <div className="flex items-start gap-4">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                        <History className="h-4 w-4 text-primary" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        {(search.searchText || search.query) && (
                                                                            <h3 className="text-lg font-medium text-foreground mb-1">
                                                                                {search.searchText || search.query}
                                                                            </h3>
                                                                        )}
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Do these filters look good? ({search.totalResults || search.totalMatches || 0} matches)
                                                                        </p>
                                                                        {(search.createdAt || search.updatedAt) && (
                                                                            <p className="text-xs text-muted-foreground/70 mt-1">
                                                                                {formatDate(search.createdAt || search.updatedAt)}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isLoadingSearchDetails && (selectedSearchDetails?.searchId === (search.searchId || search.id) || selectedSearchDetails?.id === (search.searchId || search.id)) && (
                                                                            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={(e) => {
                                                                                const id = search.searchId || search.id;
                                                                                if (id) handleRefreshSearch(id, e);
                                                                            }}
                                                                            disabled={refreshingSearchId === (search.searchId || search.id)}
                                                                            title="Refresh search"
                                                                        >
                                                                            {refreshingSearchId === (search.searchId || search.id) ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                                            ) : (
                                                                                <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Stats Section */}
                                                                <div className="flex items-center gap-6 text-sm">
                                                                    {(search.totalResults !== undefined || search.totalMatches !== undefined) && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                                            <span className="text-foreground font-medium">{search.totalResults || search.totalMatches || 0} matches</span>
                                                                        </div>
                                                                    )}
                                                                    {search.shortlistedCount !== undefined && (
                                                                        <div className="flex items-center gap-2 text-green-600">
                                                                            <CheckCircle className="h-4 w-4" />
                                                                            <span className="font-medium">{search.shortlistedCount} shortlisted</span>
                                                                        </div>
                                                                    )}
                                                                    {search.rejectedCount !== undefined && (
                                                                        <div className="flex items-center gap-2 text-red-600">
                                                                            <XCircle className="h-4 w-4" />
                                                                            <span className="font-medium">{search.rejectedCount} rejected</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Action Buttons - Only show if there are matches */}
                                                                {(search.totalResults || search.totalMatches || 0) > 0 && (
                                                                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                const id = search.searchId || search.id;
                                                                                if (id) handleViewAll(id, e);
                                                                            }}
                                                                            disabled={!search.totalResults && !search.totalMatches || (search.totalResults || search.totalMatches || 0) === 0}
                                                                            className={`${expandedPastSearches[search.searchId || search.id || '']?.filterType === 'all' ? 'bg-muted' : ''}`}
                                                                        >
                                                                            <Play className="h-4 w-4 mr-2" />
                                                                            {expandedPastSearches[search.searchId || search.id || '']?.filterType === 'all' ? 'Hide All' : 'View All'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                const id = search.searchId || search.id;
                                                                                if (id) handleViewShortlisted(id, e);
                                                                            }}
                                                                            className={`border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 ${expandedPastSearches[search.searchId || search.id || '']?.filterType === 'shortlisted' ? 'bg-green-50 dark:bg-green-950' : ''}`}
                                                                            disabled={!search.shortlistedCount || search.shortlistedCount === 0}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            {expandedPastSearches[search.searchId || search.id || '']?.filterType === 'shortlisted' ? 'Hide Shortlisted' : 'View Shortlisted'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                const id = search.searchId || search.id;
                                                                                if (id) handleViewRejected(id, e);
                                                                            }}
                                                                            className={`border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 ${expandedPastSearches[search.searchId || search.id || '']?.filterType === 'rejected' ? 'bg-red-50 dark:bg-red-950' : ''}`}
                                                                            disabled={!search.rejectedCount || search.rejectedCount === 0}
                                                                        >
                                                                            <XCircle className="h-4 w-4 mr-2" />
                                                                            {expandedPastSearches[search.searchId || search.id || '']?.filterType === 'rejected' ? 'Hide Rejected' : 'View Rejected'}
                                                                        </Button>
                                                                    </div>
                                                                )}

                                                                {/* Expanded Profiles Section - Inside Card */}
                                                                {expandedPastSearches[search.searchId || search.id || ''] && (
                                                                    <div className="mt-6 pt-6 border-t border-border space-y-4">
                                                                        {expandedPastSearches[search.searchId || search.id || '']?.isLoading ? (
                                                                            <div className="flex items-center justify-center py-8">
                                                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                                                <span className="ml-2 text-muted-foreground">Loading profiles...</span>
                                                                            </div>
                                                                        ) : expandedPastSearches[search.searchId || search.id || '']?.profiles.length === 0 ? (
                                                                            <div className="text-center py-8 text-muted-foreground">
                                                                                No {expandedPastSearches[search.searchId || search.id || '']?.filterType} profiles found.
                                                                            </div>
                                                                        ) : (
                                                                            expandedPastSearches[search.searchId || search.id || '']?.profiles.map((candidate) => {
                                                                                const resume = candidate.parsedResume;
                                                                                const experience = resume?.experience?.[0];
                                                                                const education = resume?.education?.[0];

                                                                                const candidateData = {
                                                                                    id: candidate.id || candidate._id || '',
                                                                                    name: candidate.name || candidate.fullName || 'Unknown',
                                                                                    email: candidate.email || resume?.contact?.email,
                                                                                    phone: candidate.phone || resume?.contact?.phone,
                                                                                    role: experience?.title || candidate.currentRole?.title || candidate.currentRole?.position,
                                                                                    company: experience?.company || candidate.currentRole?.company || candidate.currentRole?.companyName,
                                                                                    location: experience?.location || candidate.currentRole?.location || candidate.currentRole?.city,
                                                                                    education: education ? `${education.degree} ${education.field ? `, ${education.field}` : ''} at ${education.institution}` :
                                                                                        (candidate.education ? `${candidate.education.degree || ''} ${candidate.education.field || ''} at ${candidate.education.university || ''}` : undefined),
                                                                                    bio: candidate.resumeSummary || candidate.bio || candidate.summary || candidate.description,
                                                                                    skills: candidate.tags || candidate.skills || [],
                                                                                    socialLinks: {
                                                                                        linkedin: resume?.contact?.linkedin || candidate.linkedin,
                                                                                        github: resume?.contact?.github || candidate.github,
                                                                                        portfolio: resume?.contact?.portfolio || candidate.portfolio || candidate.website
                                                                                    }
                                                                                };

                                                                                const userId = candidate.id || candidate._id || '';
                                                                                // Check if shortlisted: search must have shortlistedCount > 0 AND userId must be in this search's shortlistedUsers
                                                                                const searchShortlistedUsers = expandedPastSearches[search.searchId || search.id || '']?.shortlistedUsers || [];
                                                                                const searchShortlistedCount = search.shortlistedCount || 0;
                                                                                const isShortlisted = searchShortlistedCount > 0 && searchShortlistedUsers.includes(userId);
                                                                                // Check if rejected: search must have rejectedCount > 0 AND userId must be in this search's rejectedUsers
                                                                                const searchRejectedUsers = expandedPastSearches[search.searchId || search.id || '']?.rejectedUsers || [];
                                                                                const searchRejectedCount = search.rejectedCount || 0;
                                                                                const isRejected = searchRejectedCount > 0 && searchRejectedUsers.includes(userId);

                                                                                return (
                                                                                    <CandidateCard
                                                                                        key={candidateData.id}
                                                                                        candidate={candidateData}
                                                                                        query={search.searchText || ''}
                                                                                        isShortlisted={isShortlisted}
                                                                                        isRejected={isRejected}
                                                                                        onShortlist={async (id: string) => {
                                                                                            const searchId = search.searchId || search.id || '';
                                                                                            const candidateUserId = candidate.id || candidate._id || id;
                                                                                            await handleShortlistUser(searchId, candidateUserId);
                                                                                        }}
                                                                                        onView={() => {
                                                                                            setSelectedCandidateForDrawer(candidate);
                                                                                            const searchId = search.searchId || search.id || '';
                                                                                            setCurrentSearchIdForDrawer(searchId || null);
                                                                                            // Check if candidate is rejected
                                                                                            const userId = candidate.id || candidate._id || '';
                                                                                            const searchRejectedUsers = expandedPastSearches[searchId]?.rejectedUsers || [];
                                                                                            const searchRejectedCount = search.rejectedCount || 0;
                                                                                            setIsCandidateRejected(searchRejectedCount > 0 && searchRejectedUsers.includes(userId));
                                                                                        }}
                                                                                    />
                                                                                );
                                                                            })
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <SearchBox onSearch={handleSearch} />
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleOpenPastSearches}
                                    className="gap-2 py-6 px-6 text-base whitespace-nowrap flex-shrink-0 shadow-lg border-border hover:border-primary/30 hover:bg-accent transition-all"
                                >
                                    <History className="h-5 w-5" />
                                    {isPastSearchesOpen ? 'Hide' : 'Show'} Past Searches
                                </Button>
                            </div>

                            {/* Past Searches Cards */}
                            {isPastSearchesOpen && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center gap-2 mb-1">
                                        <History className="h-4 w-4 text-muted-foreground" />
                                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Search History</h2>
                                    </div>
                                    {isLoadingPastSearches ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : pastSearches.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground bg-card rounded-lg border border-border">
                                            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                            <p>No past searches found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {pastSearches.map((search) => (
                                                <React.Fragment key={search.id || search.searchId}>
                                                    <Card
                                                        className="hover:shadow-lg transition-all border-2 border-border bg-card"
                                                    >
                                                        <CardContent className="p-6">
                                                            <div className="space-y-4">
                                                                {/* Header Section */}
                                                                <div className="flex items-start gap-4">
                                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                        <History className="h-4 w-4 text-primary" />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        {(search.searchText || search.query) && (
                                                                            <h3 className="text-lg font-medium text-foreground mb-1">
                                                                                {search.searchText || search.query}
                                                                            </h3>
                                                                        )}
                                                                        <p className="text-sm text-muted-foreground">
                                                                            Do these filters look good? ({search.totalResults || search.totalMatches || 0} matches)
                                                                        </p>
                                                                        {(search.createdAt || search.updatedAt) && (
                                                                            <p className="text-xs text-muted-foreground/70 mt-1">
                                                                                {formatDate(search.createdAt || search.updatedAt)}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isLoadingSearchDetails && (selectedSearchDetails?.searchId === (search.searchId || search.id) || selectedSearchDetails?.id === (search.searchId || search.id)) && (
                                                                            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                                                                        )}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={(e) => {
                                                                                const id = search.searchId || search.id;
                                                                                if (id) handleRefreshSearch(id, e);
                                                                            }}
                                                                            disabled={refreshingSearchId === (search.searchId || search.id)}
                                                                            title="Refresh search"
                                                                        >
                                                                            {refreshingSearchId === (search.searchId || search.id) ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                                            ) : (
                                                                                <RefreshCw className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                </div>

                                                                {/* Stats Section */}
                                                                <div className="flex items-center gap-6 text-sm">
                                                                    {(search.totalResults !== undefined || search.totalMatches !== undefined) && (
                                                                        <div className="flex items-center gap-2">
                                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                                            <span className="text-foreground font-medium">{search.totalResults || search.totalMatches || 0} matches</span>
                                                                        </div>
                                                                    )}
                                                                    {search.shortlistedCount !== undefined && (
                                                                        <div className="flex items-center gap-2 text-green-600">
                                                                            <CheckCircle className="h-4 w-4" />
                                                                            <span className="font-medium">{search.shortlistedCount} shortlisted</span>
                                                                        </div>
                                                                    )}
                                                                    {search.rejectedCount !== undefined && (
                                                                        <div className="flex items-center gap-2 text-red-600">
                                                                            <XCircle className="h-4 w-4" />
                                                                            <span className="font-medium">{search.rejectedCount} rejected</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Action Buttons - Only show if there are matches */}
                                                                {(search.totalResults || search.totalMatches || 0) > 0 && (
                                                                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                const id = search.searchId || search.id;
                                                                                if (id) handleViewAll(id, e);
                                                                            }}
                                                                            disabled={!search.totalResults && !search.totalMatches || (search.totalResults || search.totalMatches || 0) === 0}
                                                                            className={`${expandedPastSearches[search.searchId || search.id || '']?.filterType === 'all' ? 'bg-muted' : ''}`}
                                                                        >
                                                                            <Play className="h-4 w-4 mr-2" />
                                                                            {expandedPastSearches[search.searchId || search.id || '']?.filterType === 'all' ? 'Hide All' : 'View All'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                const id = search.searchId || search.id;
                                                                                if (id) handleViewShortlisted(id, e);
                                                                            }}
                                                                            className={`border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950 ${expandedPastSearches[search.searchId || search.id || '']?.filterType === 'shortlisted' ? 'bg-green-50 dark:bg-green-950' : ''}`}
                                                                            disabled={!search.shortlistedCount || search.shortlistedCount === 0}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                                            {expandedPastSearches[search.searchId || search.id || '']?.filterType === 'shortlisted' ? 'Hide Shortlisted' : 'View Shortlisted'}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                const id = search.searchId || search.id;
                                                                                if (id) handleViewRejected(id, e);
                                                                            }}
                                                                            className={`border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 ${expandedPastSearches[search.searchId || search.id || '']?.filterType === 'rejected' ? 'bg-red-50 dark:bg-red-950' : ''}`}
                                                                            disabled={!search.rejectedCount || search.rejectedCount === 0}
                                                                        >
                                                                            <XCircle className="h-4 w-4 mr-2" />
                                                                            {expandedPastSearches[search.searchId || search.id || '']?.filterType === 'rejected' ? 'Hide Rejected' : 'View Rejected'}
                                                                        </Button>
                                                                    </div>
                                                                )}

                                                                {/* Expanded Profiles Section - Inside Card */}
                                                                {expandedPastSearches[search.searchId || search.id || ''] && (
                                                                    <div className="mt-6 pt-6 border-t border-border space-y-4">
                                                                        {expandedPastSearches[search.searchId || search.id || '']?.isLoading ? (
                                                                            <div className="flex items-center justify-center py-8">
                                                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                                                                <span className="ml-2 text-muted-foreground">Loading profiles...</span>
                                                                            </div>
                                                                        ) : expandedPastSearches[search.searchId || search.id || '']?.profiles.length === 0 ? (
                                                                            <div className="text-center py-8 text-muted-foreground">
                                                                                No {expandedPastSearches[search.searchId || search.id || '']?.filterType} profiles found.
                                                                            </div>
                                                                        ) : (
                                                                            expandedPastSearches[search.searchId || search.id || '']?.profiles.map((candidate) => {
                                                                                const resume = candidate.parsedResume;
                                                                                const experience = resume?.experience?.[0];
                                                                                const education = resume?.education?.[0];

                                                                                const candidateData = {
                                                                                    id: candidate.id || candidate._id || '',
                                                                                    name: candidate.name || candidate.fullName || 'Unknown',
                                                                                    email: candidate.email || resume?.contact?.email,
                                                                                    phone: candidate.phone || resume?.contact?.phone,
                                                                                    role: experience?.title || candidate.currentRole?.title || candidate.currentRole?.position,
                                                                                    company: experience?.company || candidate.currentRole?.company || candidate.currentRole?.companyName,
                                                                                    location: experience?.location || candidate.currentRole?.location || candidate.currentRole?.city,
                                                                                    education: education ? `${education.degree} ${education.field ? `, ${education.field}` : ''} at ${education.institution}` :
                                                                                        (candidate.education ? `${candidate.education.degree || ''} ${candidate.education.field || ''} at ${candidate.education.university || ''}` : undefined),
                                                                                    bio: candidate.resumeSummary || candidate.bio || candidate.summary || candidate.description,
                                                                                    skills: candidate.tags || candidate.skills || [],
                                                                                    socialLinks: {
                                                                                        linkedin: resume?.contact?.linkedin || candidate.linkedin,
                                                                                        github: resume?.contact?.github || candidate.github,
                                                                                        portfolio: resume?.contact?.portfolio || candidate.portfolio || candidate.website
                                                                                    }
                                                                                };

                                                                                const userId = candidate.id || candidate._id || '';
                                                                                // Check if shortlisted: search must have shortlistedCount > 0 AND userId must be in this search's shortlistedUsers
                                                                                const searchShortlistedUsers = expandedPastSearches[search.searchId || search.id || '']?.shortlistedUsers || [];
                                                                                const searchShortlistedCount = search.shortlistedCount || 0;
                                                                                const isShortlisted = searchShortlistedCount > 0 && searchShortlistedUsers.includes(userId);
                                                                                // Check if rejected: search must have rejectedCount > 0 AND userId must be in this search's rejectedUsers
                                                                                const searchRejectedUsers = expandedPastSearches[search.searchId || search.id || '']?.rejectedUsers || [];
                                                                                const searchRejectedCount = search.rejectedCount || 0;
                                                                                const isRejected = searchRejectedCount > 0 && searchRejectedUsers.includes(userId);

                                                                                return (
                                                                                    <CandidateCard
                                                                                        key={candidateData.id}
                                                                                        candidate={candidateData}
                                                                                        query={search.searchText || ''}
                                                                                        isShortlisted={isShortlisted}
                                                                                        isRejected={isRejected}
                                                                                        onShortlist={async (id: string) => {
                                                                                            const searchId = search.searchId || search.id || '';
                                                                                            const candidateUserId = candidate.id || candidate._id || id;
                                                                                            await handleShortlistUser(searchId, candidateUserId);
                                                                                        }}
                                                                                        onView={() => {
                                                                                            setSelectedCandidateForDrawer(candidate);
                                                                                            const searchId = search.searchId || search.id || '';
                                                                                            setCurrentSearchIdForDrawer(searchId || null);
                                                                                            // Check if candidate is rejected
                                                                                            const userId = candidate.id || candidate._id || '';
                                                                                            const searchRejectedUsers = expandedPastSearches[searchId]?.rejectedUsers || [];
                                                                                            const searchRejectedCount = search.rejectedCount || 0;
                                                                                            setIsCandidateRejected(searchRejectedCount > 0 && searchRejectedUsers.includes(userId));
                                                                                        }}
                                                                                    />
                                                                                );
                                                                            })
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <ResultSummary
                                query={searchQuery}
                                matchCount={matchCount}
                                filters={filters}
                                onEditFilters={() => setIsFilterDrawerOpen(true)}
                                onRunSearch={handleRunSearch}
                            />
                        </div>

                        {/* Search Results - List Format */}
                        {isSearching ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Candidate Results</h2>
                                </div>
                                <div className="bg-card rounded-lg border border-border shadow-sm">
                                <ResultsHeader
                                    totalCount={matchCount}
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                    isAllSelected={isAllSelected}
                                    onSelectAll={setIsAllSelected}
                                    onPageChange={handlePageChange}
                                />
                                <div className="p-6">
                                    {searchResults.map((candidate) => {
                                        // Extract data from parsedResume if available
                                        const resume = candidate.parsedResume;
                                        const experience = resume?.experience?.[0];
                                        const education = resume?.education?.[0];
                                        const contact = resume?.contact;

                                        // Map CandidateProfile to CandidateCard props
                                        const candidateData = {
                                            id: candidate.id || candidate._id || '',
                                            name: candidate.name || candidate.fullName || 'Unknown',
                                            email: candidate.email,
                                            phone: candidate.phone,
                                            // Prefer parsed resume data, fallback to top-level fields
                                            role: experience?.title || candidate.currentRole?.title || candidate.currentRole?.position,
                                            company: experience?.company || candidate.currentRole?.company || candidate.currentRole?.companyName,
                                            location: experience?.location || candidate.currentRole?.location || candidate.currentRole?.city,
                                            education: education ? `${education.degree} ${education.field ? `, ${education.field}` : ''} at ${education.institution}` :
                                                (candidate.education ? `${candidate.education.degree || ''} ${candidate.education.field || ''} at ${candidate.education.university || ''}` : undefined),
                                            bio: candidate.resumeSummary || candidate.bio || candidate.summary || candidate.description,
                                            skills: candidate.tags || candidate.skills || [],
                                            matchScore: undefined,
                                            socialLinks: {
                                                linkedin: contact?.linkedin || candidate.linkedin,
                                                github: contact?.github || candidate.github,
                                                portfolio: contact?.portfolio || candidate.portfolio || candidate.website
                                            }
                                        };

                                        const userId = candidate.id || candidate._id || (candidate as any).userId || candidateData.id;
                                        // Check if shortlisted: search must have shortlistedCount > 0 AND userId must be in this search's shortlistedUsers
                                        const searchShortlistedUsers = selectedSearchDetails?.shortlistedUsers || [];
                                        const searchShortlistedCount = selectedSearchDetails?.shortlistedCount || 0;
                                        // Extract userIds from shortlistedUsers array (could be objects or strings)
                                        const shortlistedUserIds = searchShortlistedUsers.map((user: any) => {
                                            if (typeof user === 'string') return user;
                                            return user?._id || user?.id || user?.userId || '';
                                        }).filter(Boolean);
                                        const isShortlisted = searchShortlistedCount > 0 && shortlistedUserIds.includes(userId);
                                        // Check if rejected: search must have rejectedCount > 0 AND userId must be in this search's rejectedUsers
                                        const searchRejectedUsers = selectedSearchDetails?.rejectedUsers || [];
                                        const searchRejectedCount = selectedSearchDetails?.rejectedCount || 0;
                                        // Extract userIds from rejectedUsers array (could be objects or strings)
                                        const rejectedUserIds = searchRejectedUsers.map((user: any) => {
                                            if (typeof user === 'string') return user;
                                            return user?._id || user?.id || user?.userId || '';
                                        }).filter(Boolean);
                                        const isRejected = searchRejectedCount > 0 && rejectedUserIds.includes(userId);

                                        return (
                                            <CandidateCard
                                                key={candidateData.id}
                                                candidate={candidateData}
                                                query={searchQuery}
                                                isShortlisted={isShortlisted}
                                                isRejected={isRejected}
                                                onShortlist={async (id: string) => {
                                                    if (selectedSearchDetails?.searchId || selectedSearchDetails?.id) {
                                                        const searchId = selectedSearchDetails.searchId || selectedSearchDetails.id || '';
                                                        const candidateUserId = candidate.id || candidate._id || (candidate as any).userId || id;
                                                        await handleShortlistUser(searchId, candidateUserId);
                                                    }
                                                }}
                                                onView={() => {
                                                    setSelectedCandidateForDrawer(candidate);
                                                    // Check if candidate is rejected
                                                    const userId = candidate.id || candidate._id || (candidate as any).userId || candidateData.id;
                                                    const searchRejectedUsers = selectedSearchDetails?.rejectedUsers || [];
                                                    const searchRejectedCount = selectedSearchDetails?.rejectedCount || 0;
                                                    const rejectedUserIds = searchRejectedUsers.map((user: any) => {
                                                        if (typeof user === 'string') return user;
                                                        return user?._id || user?.id || user?.userId || '';
                                                    }).filter(Boolean);
                                                    setIsCandidateRejected(searchRejectedCount > 0 && rejectedUserIds.includes(userId));
                                                }}
                                            />
                                        );
                                    })}
                                        </div>
                                </div>
                            </div>
                        ) : hasSearched && !isSearching ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>No candidates found. Try adjusting your search query.</p>
                            </div>
                        ) : null}
                    </>
                )}

                <Modal
                    isOpen={!!selectedApp}
                    onClose={() => setSelectedApp(null)}
                    title="Candidate Profile"
                >
                    {selectedApp && (
                        <CandidateCard
                            candidate={{
                                id: selectedApp.id || selectedApp.applicationId || '',
                                name: selectedApp.candidateName,
                                email: selectedApp.email,
                                phone: selectedApp.phone,
                                company: selectedApp.currentCompany,
                                bio: selectedApp.resumePreview,
                                skills: selectedApp.tags,
                                matchScore: selectedApp.scores?.unifiedScore || selectedApp.alignmentScore,
                                resumeScore: selectedApp.scores?.resumeScore,
                                status: typeof selectedApp.status === 'string' ? selectedApp.status : 'Unknown',
                            }}
                            onView={(id) => {
                                console.log('View candidate from modal:', id);
                            }}
                            onShortlist={(id) => {
                                console.log('Shortlist candidate from modal:', id);
                            }}
                        />
                    )}
                </Modal>

                <FilterDrawer
                    isOpen={isFilterDrawerOpen}
                    onClose={() => setIsFilterDrawerOpen(false)}
                    filters={filters}
                    onSave={handleUpdateFilters}
                />

                <CandidateProfileDrawer
                    isOpen={!!selectedCandidateForDrawer}
                    onClose={() => {
                        setSelectedCandidateForDrawer(null);
                        setCurrentSearchIdForDrawer(null);
                        setIsCandidateRejected(false);
                    }}
                    candidate={selectedCandidateForDrawer}
                    fromRecruiterPage={true}
                    searchId={currentSearchIdForDrawer || undefined}
                    isRejected={isCandidateRejected}
                />
            </div>
        </div>
    );
};

export default RecruiterDashboard;
