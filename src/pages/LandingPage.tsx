import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Briefcase, Users, Search, ArrowRight, CheckCircle2, Zap, Shield } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col animate-in fade-in duration-500">
            {/* Hero Section */}
            <header className="px-6 py-12 md:py-24 lg:py-32 text-center space-y-8 bg-gradient-to-b from-background to-accent/20">
                <div className="space-y-4 max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                        HireWise
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground">
                        The AI-powered recruiting platform that streamlines hiring for everyone.
                    </p>
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link to="/hr/create">Post a Job</Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link to="/hr/dashboard">View Dashboard</Link>
                    </Button>
                </div>
            </header>

            {/* Role Selection Section */}
            <section className="container mx-auto px-6 py-16 space-y-12">
                <h2 className="text-3xl font-bold text-center">Choose Your Path</h2>
                <div className="grid gap-8 md:grid-cols-3">
                    {/* HR Card */}
                    <Card className="hover:shadow-lg transition-shadow border-primary/20">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Briefcase className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>For HR Managers</CardTitle>
                            <CardDescription>Create perfect job descriptions with AI assistance.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> AI-enhanced JDs</li>
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Smart clarification</li>
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Instant publishing</li>
                            </ul>
                            <Button className="w-full" asChild>
                                <Link to="/hr/create">Create Job <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Candidate Card */}
                    <Card className="hover:shadow-lg transition-shadow border-primary/20">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Search className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>For Candidates</CardTitle>
                            <CardDescription>Apply to jobs and showcase your skills via video.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Easy application</li>
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Video screening</li>
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Transparent process</li>
                            </ul>
                            <Button className="w-full" variant="secondary" asChild>
                                {/* For demo purposes, link to a known job or the agent page of the first job if available, 
                    but since we don't have a job list here, we'll link to the debug page to find one */}
                                <Link to="/debug">Find Jobs <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recruiter Card */}
                    <Card className="hover:shadow-lg transition-shadow border-primary/20">
                        <CardHeader>
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>For Recruiters</CardTitle>
                            <CardDescription>Efficiently review and manage applications.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Kanban dashboard</li>
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> AI alignment scores</li>
                                <li className="flex items-center"><CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Video review</li>
                            </ul>
                            <Button className="w-full" variant="outline" asChild>
                                <Link to="/recruiter/dashboard">Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" /></Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Features Section */}
            <section className="bg-muted/30 py-16">
                <div className="container mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Why HireWise?</h2>
                    <div className="grid gap-8 md:grid-cols-3 text-center">
                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-sm">
                                <Zap className="h-6 w-6 text-yellow-500" />
                            </div>
                            <h3 className="text-xl font-semibold">Lightning Fast</h3>
                            <p className="text-muted-foreground">From job creation to candidate review, every step is optimized for speed.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-sm">
                                <Shield className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-semibold">Fair & Unbiased</h3>
                            <p className="text-muted-foreground">Structured data and AI scoring help reduce bias in the hiring process.</p>
                        </div>
                        <div className="space-y-4">
                            <div className="mx-auto w-12 h-12 bg-background rounded-full flex items-center justify-center shadow-sm">
                                <Users className="h-6 w-6 text-green-500" />
                            </div>
                            <h3 className="text-xl font-semibold">Human Centric</h3>
                            <p className="text-muted-foreground">Technology that empowers people, not replaces them.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-muted-foreground text-sm">
                <p>© 2024 HireWise. Built for the future of hiring.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
