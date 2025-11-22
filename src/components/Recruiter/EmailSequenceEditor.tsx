import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronLeft, Plus, Mail, Phone,
    Bold, Italic, Underline, List, Link as LinkIcon,
    MoreHorizontal, ChevronDown, AlertTriangle, Play,
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
    screeningId,
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
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
            {/* Header */}
            <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ChevronLeft className="h-5 w-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">Edit Sequence</h1>
                        <p className="text-xs text-gray-500">Created by Anish Bansal on Nov 21st, 2025</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="text-gray-600">
                        Save Draft
                    </Button>
                    <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={handleStartSequence}
                    >
                        Start Sequence
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
                    <div className="p-4 border-b border-gray-200">
                        <h2 className="font-semibold text-gray-900">Steps ({steps.length})</h2>
                        <p className="text-xs text-gray-500 mt-1">We recommend having 3+ steps.</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${activeStepId === step.id
                                    ? 'bg-purple-50 border-purple-200 shadow-sm'
                                    : 'bg-white border-gray-200 hover:border-purple-200'
                                    }`}
                                onClick={() => setActiveStepId(step.id)}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${activeStepId === step.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        Step {step.id}
                                    </span>
                                    <span className="text-sm font-medium text-gray-900">{step.type}</span>
                                </div>
                                <p className="text-xs text-gray-500">Nov 21, 3:47 PM (+0530)</p>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-gray-200 relative">
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                            onClick={() => setIsAddStepOpen(!isAddStepOpen)}
                        >
                            <Plus className="h-4 w-4" />
                            Add Step
                        </Button>

                        {isAddStepOpen && (
                            <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-10">
                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-gray-700"
                                    onClick={() => addStep('Email')}
                                >
                                    <Mail className="h-4 w-4 text-blue-500" />
                                    Email
                                </button>
                                <button
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-sm font-medium text-gray-700 border-t border-gray-100"
                                    onClick={() => addStep('Call')}
                                >
                                    <Phone className="h-4 w-4 text-green-500" />
                                    Call
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Warning Alert */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-amber-800">Resolve the following issues</h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    There is no sender email address specified. Please select or <a href="#" className="underline font-medium">connect an email account</a> to start sending emails.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Editor Header */}
                            <div className="p-6 border-b border-gray-200 space-y-6">
                                <div className="flex items-center gap-4">
                                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                                        Step {activeStep.id}
                                    </span>
                                    <div className="relative group">
                                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                                            {activeStep.type === 'Email' ? (
                                                <Mail className="h-4 w-4 text-blue-500" />
                                            ) : (
                                                <Phone className="h-4 w-4 text-green-500" />
                                            )}
                                            {activeStep.type}
                                            <ChevronDown className="h-3 w-3 text-gray-400" />
                                        </button>
                                    </div>
                                </div>



                                {activeStep.type === 'Email' ? (
                                    <>
                                        <div className="space-y-4">


                                            <div className="grid grid-cols-[80px_1fr] gap-4 items-center">
                                                <label className="text-sm font-semibold text-gray-900">Subject</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={subject}
                                                        onChange={(e) => setSubject(e.target.value)}
                                                        className="w-full text-sm border-gray-300 rounded-md py-2 pr-16 focus:ring-purple-500 focus:border-purple-500"
                                                    />
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-gray-500">
                                                        <button className="hover:text-gray-900">Cc</button>
                                                        <button className="hover:text-gray-900">Bcc</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-gray-900 block mb-3">Variables</label>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-2 h-8">
                                                    <Play className="h-3 w-3 fill-current" />
                                                    Preview and Test
                                                </Button>
                                                <Button variant="outline" size="sm" className="gap-2 h-8 bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100">
                                                    <Wand2 className="h-3 w-3" />
                                                    AI Command
                                                </Button>
                                                <Button variant="outline" size="sm" className="gap-2 h-8 bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100">
                                                    <Code className="h-3 w-3" />
                                                    Snippets
                                                </Button>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {variables.map((variable) => (
                                                    <button
                                                        key={variable}
                                                        className="px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium hover:bg-purple-100 transition-colors"
                                                    >
                                                        {variable}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                                            <p className="font-medium">Call Task</p>
                                            <p className="mt-1">This step will create a task for you to call the candidate.</p>
                                            <p className="mt-2 text-xs text-blue-600 font-medium flex items-center gap-1">
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
                                    <div className="border-b border-gray-200 p-2 flex items-center gap-1 bg-gray-50">
                                        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                                            <ChevronLeft className="h-4 w-4 rotate-180" />
                                        </button>
                                        <div className="w-px h-4 bg-gray-300 mx-1" />
                                        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                                            <Bold className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                                            <Italic className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                                            <Underline className="h-4 w-4" />
                                        </button>
                                        <div className="w-px h-4 bg-gray-300 mx-1" />
                                        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                                            <List className="h-4 w-4" />
                                        </button>
                                        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                                            <LinkIcon className="h-4 w-4" />
                                        </button>
                                        <div className="w-px h-4 bg-gray-300 mx-1" />
                                        <select className="bg-transparent text-sm text-gray-600 border-none focus:ring-0 cursor-pointer">
                                            <option>Arial</option>
                                            <option>Inter</option>
                                            <option>Roboto</option>
                                        </select>
                                        <select className="bg-transparent text-sm text-gray-600 border-none focus:ring-0 cursor-pointer">
                                            <option>14px</option>
                                            <option>16px</option>
                                            <option>12px</option>
                                        </select>
                                        <div className="flex-1" />
                                        <button className="p-1.5 rounded hover:bg-gray-200 text-gray-600">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="p-6 min-h-[300px]">
                                        <textarea
                                            className="w-full h-full min-h-[300px] resize-none border-none focus:ring-0 text-gray-700 text-base p-0"
                                            placeholder="Start drafting a new email here..."
                                            value={activeStep.content}
                                            onChange={(e) => handleContentChange(e.target.value)}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-6 min-h-[300px]">

                                    <textarea
                                        className="w-full h-full min-h-[300px] resize-none border border-gray-200 rounded-lg p-4 focus:ring-purple-500 focus:border-purple-500 text-gray-700 text-base"
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
