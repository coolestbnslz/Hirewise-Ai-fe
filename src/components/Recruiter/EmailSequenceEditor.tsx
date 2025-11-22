import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronLeft, Plus, Mail, Phone,
    Bold, Italic, Underline, List, Link as LinkIcon,
    MoreHorizontal, ChevronDown, Play,
    Wand2, Code
} from 'lucide-react';
import { Button } from '../ui/Button';

import { request } from '../../api/apiClient';

interface EmailSequenceEditorProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    screeningId?: string;
    initialSubject?: string;
    initialContent?: string;
}

export const EmailSequenceEditor: React.FC<EmailSequenceEditorProps> = ({
    isOpen,
    onClose,
    candidateId,
    // screeningId,
    initialSubject,
    initialContent
}) => {
    const [steps, setSteps] = useState([
        { id: 1, type: 'Email', label: 'Step 1', content: initialContent || '' }
    ]);
    const [activeStepId, setActiveStepId] = useState(1);
    const [isAddStepOpen, setIsAddStepOpen] = useState(false);
    const [subject, setSubject] = useState(initialSubject || "Congratulations! You've been approved for the next round");

    // Update state when initial props change (when component opens with new data)
    useEffect(() => {
        if (isOpen) {
            console.log('EmailSequenceEditor useEffect triggered - Subject:', initialSubject, 'Content:', initialContent?.substring(0, 50) + '...');
            if (initialSubject) {
                console.log('Setting subject to:', initialSubject);
                setSubject(initialSubject);
            }
            if (initialContent) {
                console.log('Setting content, length:', initialContent.length);
                setSteps([{ id: 1, type: 'Email', label: 'Step 1', content: initialContent }]);
                setActiveStepId(1); // Ensure we're on step 1
            }
        } else {
            // Reset when closed
            setSteps([{ id: 1, type: 'Email', label: 'Step 1', content: '' }]);
            setSubject("Congratulations! You've been approved for the next round");
        }
    }, [isOpen, initialSubject, initialContent]);

    // Derived state for active step
    const activeStep = steps.find(s => s.id === activeStepId) || steps[0];

    const addStep = (type: 'Email' | 'Call') => {
        const newId = steps.length + 1;
        setSteps([...steps, { id: newId, type, label: `Step ${newId}`, content: '' }]);
        setActiveStepId(newId);
        setIsAddStepOpen(false);
    };

    const handleContentChange = (content: string) => {
        setSteps(steps.map(step =>
            step.id === activeStepId ? { ...step, content } : step
        ));
    };

    const handleStartSequence = async () => {
        try {
            const promises = steps.map(async (step) => {
                if (step.type === 'Email') {
                    await request('/api/email/send', {
                        method: 'POST',
                        body: JSON.stringify({
                            userId: candidateId,
                            subject: subject,
                            html: step.content
                                ? step.content.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '<br>').join('')
                                : "<h1>Hello!</h1><p>You are invited for an interview.</p>"
                        })
                    });
                } else if (step.type === 'Call') {
                    await request(`/api/applications/${candidateId}/schedule-call`, {
                        method: 'POST',
                        body: JSON.stringify({
                            userId: candidateId,
                            start_time: "2024-12-25 14:30:00 +05:30"
                        })
                    });
                }
            });

            await Promise.all(promises);
            alert("Call scheduled");
            onClose();
        } catch (error) {
            console.error("Error starting sequence:", error);
            alert("Failed to start sequence");
        }
    };

    if (!isOpen) return null;

    const variables = [
        'Spintax Greeting', 'First Name', 'Company', 'Job Title',
        'Education', 'Sender First Name', 'More'
    ];

    return createPortal(
        <div className="fixed inset-0 z-[60] bg-background flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">Edit Sequence</h1>
                        <p className="text-xs text-muted-foreground">Created by Anish Bansal on Nov 21st, 2025</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="text-muted-foreground">
                        Save Draft
                    </Button>
                    <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-white"
                        onClick={handleStartSequence}
                    >
                        Start Sequence
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-border bg-muted flex flex-col">
                    <div className="p-4 border-b border-border">
                        <h2 className="font-semibold text-foreground">Steps ({steps.length})</h2>
                        <p className="text-xs text-muted-foreground mt-1">We recommend having 3+ steps.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${activeStepId === step.id
                                    ? 'bg-primary/10 dark:bg-primary/20 border-primary/20 dark:border-primary/30 shadow-sm'
                                    : 'bg-card border-border hover:border-primary/30'
                                    }`}
                                onClick={() => setActiveStepId(step.id)}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${activeStepId === step.id ? 'bg-primary/20 dark:bg-primary/30 text-primary' : 'bg-muted text-muted-foreground'
                                        }`}>
                                        Step {step.id}
                                    </span>
                                    <span className="text-sm font-medium text-foreground">{step.type}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">Nov 21, 3:47 PM (+0530)</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-border relative">
                        <Button
                            className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
                            onClick={() => setIsAddStepOpen(!isAddStepOpen)}
                        >
                            <Plus className="h-4 w-4" />
                            Add Step
                        </Button>

                        {isAddStepOpen && (
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-card rounded-lg shadow-xl border border-border overflow-hidden z-10">
                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-accent flex items-center gap-3 text-sm font-medium text-foreground"
                                    onClick={() => addStep('Email')}
                                >
                                    <Mail className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                    Email
                                </button>
                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-accent flex items-center gap-3 text-sm font-medium text-foreground border-t border-border"
                                    onClick={() => addStep('Call')}
                                >
                                    <Phone className="h-4 w-4 text-green-500 dark:text-green-400" />
                                    Call
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-muted/50 p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                            {/* Editor Header */}
                            <div className="p-6 border-b border-border space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="bg-primary/10 dark:bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                        Step {activeStep.id}
                                    </span>
                                    <div className="relative group">
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-accent">
                                            {activeStep.type === 'Email' ? (
                                                <Mail className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                                            ) : (
                                                <Phone className="h-4 w-4 text-green-500 dark:text-green-400" />
                                            )}
                                            {activeStep.type}
                                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>



                                {activeStep.type === 'Email' ? (
                                    <>
                                        <div className="space-y-4">


                                            <div className="flex items-center gap-4">
                                                <label className="text-sm font-semibold text-foreground w-20 flex-shrink-0">Subject</label>
                                                <div className="relative flex-1">
                                                    <input
                                                        type="text"
                                                        value={subject}
                                                        onChange={(e) => setSubject(e.target.value)}
                                                        className="w-full text-sm border border-input bg-background rounded-md px-3 py-2 pr-16 focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                                                    />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-muted-foreground">
                                                        <button className="hover:text-foreground">Cc</button>
                                                        <button className="hover:text-foreground">Bcc</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-foreground block mb-3">Variables</label>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white gap-2 h-8">
                                                    <Play className="h-3 w-3 fill-current" />
                                                    Preview and Test
                                                </Button>
                                                <Button variant="outline" size="sm" className="gap-2 h-8 bg-primary/10 dark:bg-primary/20 text-primary border-primary/20 dark:border-primary/30 hover:bg-primary/20 dark:hover:bg-primary/30">
                                                    <Wand2 className="h-3 w-3" />
                                                    AI Command
                                                </Button>
                                                <Button variant="outline" size="sm" className="gap-2 h-8 bg-primary/10 dark:bg-primary/20 text-primary border-primary/20 dark:border-primary/30 hover:bg-primary/20 dark:hover:bg-primary/30">
                                                    <Code className="h-3 w-3" />
                                                    Snippets
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {variables.map((variable) => (
                                                    <button
                                                        key={variable}
                                                        className="px-2 py-1 rounded bg-primary/10 dark:bg-primary/20 text-primary text-xs font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
                                                    >
                                                        {variable}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
                                            <p className="font-medium">Call Task</p>
                                            <p className="mt-1">This step will create a task for you to call the candidate.</p>
                                            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                                <Wand2 className="h-3 w-3" />
                                                AI-based call summary is available once scheduled call is completed.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Editor Content Area */}
                            {activeStep.type === 'Email' ? (
                                <>
                                    {/* Editor Toolbar */}
                                    <div className="border-b border-border p-2 flex items-center gap-1 bg-muted">
                                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                                            <ChevronLeft className="h-4 w-4 rotate-180" />
                                        </button>
                                        <div className="w-px h-4 bg-border mx-1" />
                                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                                            <Bold className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                                            <Italic className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                                            <Underline className="h-4 w-4" />
                                        </button>
                                        <div className="w-px h-4 bg-border mx-1" />
                                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                                            <List className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                                            <LinkIcon className="h-4 w-4" />
                                        </button>
                                        <div className="w-px h-4 bg-border mx-1" />
                                        <select className="bg-transparent text-sm text-muted-foreground border-none focus:ring-0 cursor-pointer">
                                            <option>Arial</option>
                                            <option>Inter</option>
                                            <option>Roboto</option>
                                        </select>
                                        <select className="bg-transparent text-sm text-muted-foreground border-none focus:ring-0 cursor-pointer">
                                            <option>14px</option>
                                            <option>16px</option>
                                            <option>12px</option>
                                        </select>
                                        <div className="flex-1" />
                                        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="p-6 min-h-[300px]">
                                        <textarea
                                            className="w-full h-full min-h-[300px] resize-none border-none focus:ring-0 text-foreground text-base p-0 bg-transparent"
                                            placeholder="Start drafting a new email here..."
                                            value={activeStep.content}
                                            onChange={(e) => handleContentChange(e.target.value)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 min-h-[300px]">

                                    <textarea
                                        className="w-full h-full min-h-[300px] resize-none border border-input rounded-lg p-4 focus:ring-primary focus:border-primary text-foreground text-base bg-background"
                                        value={activeStep.content}
                                        onChange={(e) => handleContentChange(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
