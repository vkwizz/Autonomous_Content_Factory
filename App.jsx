import React, { createContext, useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import {
    Bot,
    BrainCircuit,
    PenTool,
    ShieldCheck,
    Upload,
    ChevronRight,
    FileText,
    MessageSquare,
    Mail,
    Copy,
    Download,
    CheckCircle,
    RefreshCcw,
    Smartphone,
    Monitor,
    LayoutGrid,
    Clock,
    Info,
    Search,
    Package,
    Command,
    User,
    Zap,
    Briefcase,
    Camera,
    ScrollText,
    BookOpen,
    Lightbulb
} from 'lucide-react';

export const AppContext = createContext();

export default function App() {
    const [sourceData, setSourceData] = useState('');
    const [factSheet, setFactSheet] = useState(null);
    const [outputs, setOutputs] = useState({
        blog: '',
        social: '',
        email: '',
        linkedin: '',
        instagram: [],
        flashcards: [],
        insights: []
    });
    const [campaignHistory, setCampaignHistory] = useState(() => {
        const saved = localStorage.getItem('cymonic_history');
        return saved ? JSON.parse(saved) : [];
    });

    const saveCampaign = (campaignData) => {
        const newHistory = [campaignData, ...campaignHistory];
        setCampaignHistory(newHistory);
        localStorage.setItem('cymonic_history', JSON.stringify(newHistory));
    };

    return (
        <AppContext.Provider value={{ sourceData, setSourceData, factSheet, setFactSheet, outputs, setOutputs, campaignHistory, saveCampaign }}>
            <HashRouter>
                <Layout>
                    <Routes>
                        <Route path="/" element={<CampaignStartPage />} />
                        <Route path="/agent-room" element={<AgentRoomPage />} />
                        <Route path="/review" element={<FinalReviewPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/about" element={<AboutPage />} />
                    </Routes>
                </Layout>
            </HashRouter>
        </AppContext.Provider>
    );
}

function Layout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutGrid },
        { path: '/history', label: 'History', icon: Clock },
        { path: '/about', label: 'About', icon: Info }
    ];

    return (
        <div className="app-container">
            <header className="floating-navbar fade-in">
                <div className="nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer', background: 'transparent' }}>
                    <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Cymonic Logo" style={{ height: '32px', width: '32px' }} />
                </div>

                <div className="nav-divider"></div>

                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || (item.path === '/' && (location.pathname === '/agent-room' || location.pathname === '/review'));

                    return (
                        <div
                            key={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                            title={item.label}
                        >
                            <Icon size={18} />
                            {isActive && <span>{item.label}</span>}
                        </div>
                    );
                })}

                <div className="nav-divider"></div>

                <div className="nav-avatar" style={{ background: '#e5e7fa', color: 'var(--primary)' }}>
                    <User size={20} style={{ margin: 'auto' }} />
                </div>
            </header>
            <main className="fade-in">
                {children}
            </main>
        </div>
    );
}

function CampaignStartPage() {
    const { sourceData, setSourceData } = React.useContext(AppContext);
    const navigate = useNavigate();
    const [isDragging, setIsDragging] = useState(false);

    const handleStart = () => {
        if (sourceData.trim().length > 10) {
            navigate('/agent-room');
        } else {
            alert("Please provide some source text first.");
        }
    };

    const MAX_CHARS = 6000;
    const fileInputRef = React.useRef(null);

    const loadFileText = (file) => {
        if (!file) return;

        const allowedTypes = ['text/plain', 'text/markdown', 'text/x-markdown'];
        const allowedExts = ['.txt', '.md'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();

        if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
            alert(
                `"${file.name}" is not supported.\n\n` +
                `Word (.docx), PDF, and other rich formats cannot be read directly.\n\n` +
                `✅ Please:\n` +
                `  • Open the file in Word / Google Docs\n` +
                `  • Select All (Ctrl+A) → Copy (Ctrl+C)\n` +
                `  • Paste it into the text box below`
            );
            return;
        }

        if (file.size > 50 * 1024) {
            alert(`File is too large (${(file.size / 1024).toFixed(0)}KB). Please upload a file under 50KB, or paste the text manually.`);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            if (text.length > MAX_CHARS) {
                setSourceData(text.slice(0, MAX_CHARS));
                alert(`File loaded! Content was trimmed to ${MAX_CHARS} characters to stay within AI token limits.`);
            } else {
                setSourceData(text);
            }
        };
        reader.readAsText(file);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            loadFileText(file);
        } else {
            const text = e.dataTransfer.getData('text');
            if (text) setSourceData(text.slice(0, MAX_CHARS));
        }
    };

    const handleFilePick = (e) => {
        loadFileText(e.target.files?.[0]);
    };

    const handleSampleLoad = () => {
        setSourceData("Acme Corp is launching the TerraPhone X, a $799 smartphone aimed at Gen Z creators. Core features include a 3-day battery life, 4K holographic display, and AI-editing suite. Tone should be energetic and persuasive. The goal is to drive pre-orders.");
        navigate('/agent-room');
    };

    return (
        <div className="glass-panel fade-in" style={{ padding: '60px 40px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '36px', marginBottom: '16px' }} className="title-gradient">Autonomous Content Factory</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
                    Upload an unstructured fact sheet, technical spec, or transcript. Our multi-agent system will extract the core facts and launch a 360° marketing campaign.
                </p>
            </div>

            <input
                ref={fileInputRef}
                id="file-input-hidden"
                type="file"
                accept=".txt,.md"
                style={{ display: 'none' }}
                onChange={handleFilePick}
            />
            <div
                className={`upload-zone fade-in ${isDragging ? 'drag-active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Upload className="upload-icon" />
                <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Drag & Drop your source file</h3>
                <p style={{ color: 'var(--text-muted)' }}>We accept .txt or .md files up to 50KB</p>

                <div style={{ marginTop: '24px', position: 'relative', zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-secondary" onClick={handleSampleLoad} style={{ fontSize: '13px', padding: '8px 16px' }}>
                        <Zap size={14} color="var(--warning)" /> Try Example Input
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '24px' }}>
                <textarea
                    className="input-field"
                    rows="8"
                    placeholder="Paste latest feature specs, transcripts, or notes..."
                    value={sourceData}
                    onChange={(e) => setSourceData(e.target.value)}
                    style={{ resize: 'vertical' }}
                ></textarea>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleStart} style={{ padding: '12px 32px', fontSize: '16px' }}>
                    Initialize Agents <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

function AgentRoomPage() {
    const { sourceData, setFactSheet, setOutputs } = React.useContext(AppContext);
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [logs, setLogs] = useState([]);

    const feedEndRef = React.useRef(null);

    useEffect(() => {
        feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    useEffect(() => {
        const addLog = (msg, type = 'system', color = '') => {
            setLogs(prev => [...prev, { id: Date.now() + Math.random(), msg, type, color }]);
        };

        setCurrentStep(1);
        addLog("Initializing AI Campaign Assembly...", "system");

        const fetchData = async () => {
            try {
                const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/generate';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ inputText: sourceData || "Simulated test content" })
                });

                if (!response.ok) throw new Error("Server response not ok");

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                let buffer = '';
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.substring(6));
                                if (data.type === 'log') {
                                    addLog(data.log.msg, data.log.agent, data.log.color);
                                    if (data.log.step) setCurrentStep(data.log.step);
                                } else if (data.type === 'factSheet') {
                                    let featuresList = data.data.key_features || [];
                                    if (!Array.isArray(featuresList)) featuresList = [data.data.key_features];
                                    setFactSheet({
                                        audience: data.data.target_audience || "General",
                                        valueProp: data.data.value_proposition || "Value prop missing",
                                        features: featuresList,
                                        tone: data.data.tone || "Neutral",
                                        entities: Array.isArray(data.data.entities) ? data.data.entities : [],
                                        metrics: Array.isArray(data.data.metrics) ? data.data.metrics : [],
                                        technical: Array.isArray(data.data.technical_details) ? data.data.technical_details : [],
                                        constraints: Array.isArray(data.data.constraints) ? data.data.constraints : [],
                                        uncertainties: Array.isArray(data.data.uncertainties) ? data.data.uncertainties : [],
                                        risks: Array.isArray(data.data.risks) ? data.data.risks : [],
                                        ambiguities: Array.isArray(data.data.ambiguous_points) ? data.data.ambiguous_points : [],
                                        product: data.data.product || "Unknown"
                                    });
                                } else if (data.type === 'drafts') {
                                    const rawSocial = data.data.social || data.data.social_thread || "";
                                    const socialText = Array.isArray(rawSocial) ? rawSocial.join('\n\n') : rawSocial;
                                    setOutputs({
                                        blog: data.data.blog || data.data.blog_post || "",
                                        social: socialText,
                                        email: data.data.email || data.data.email_teaser || "",
                                        linkedin: data.data.linkedin || "",
                                        instagram: Array.isArray(data.data.instagram) ? data.data.instagram : [],
                                        flashcards: Array.isArray(data.data.flashcards) ? data.data.flashcards : [],
                                        insights: Array.isArray(data.data.insights) ? data.data.insights : []
                                    });
                                } else if (data.type === 'complete') {
                                    setCurrentStep(6);
                                } else if (data.type === 'error') {
                                    addLog("Error: " + data.error, 'system', 'var(--accent)');
                                    setCurrentStep(6);
                                }
                            } catch (e) {
                                console.error("Event parse error", e, line);
                            }
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                addLog('Failed to connect to AI backend. Make sure to run node server.js', 'system', 'var(--accent)');
                setCurrentStep(6);
            }
        };

        if (sourceData) {
            fetchData();
        } else {
            addLog("No source data found. Go back to upload.", "system", "var(--accent)");
            setCurrentStep(6);
        }
    }, []);

    return (
        <div className="glass-panel" style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>The Agent Room</h2>
                <p style={{ color: 'var(--text-muted)' }}>Watch the Autonomous Factory collaborate in real-time.</p>
            </div>

            <div className="agent-room-layout">
                <div className="agent-col">
                    <div className={`agent-card glass-panel fade-in ${currentStep === 1 ? 'active' : ''}`}>
                        <div className="agent-avatar" style={{ width: '50px', height: '50px' }}><Zap size={24} /></div>
                        <div>
                            <h4 className="text-gradient-primary">NLP Preprocessor</h4>
                            <div className="agent-status" style={{ opacity: currentStep === 1 ? 1 : 0.4 }}>
                                {currentStep === 1 ? <span className="typing-dot">Parsing</span> : 'Standby'}
                            </div>
                        </div>
                    </div>

                    <div className={`agent-card glass-panel fade-in ${currentStep === 2 ? 'active' : ''}`}>
                        <div className="agent-avatar" style={{ width: '50px', height: '50px' }}><BrainCircuit size={24} /></div>
                        <div>
                            <h4 className="text-gradient-primary">Lead Research</h4>
                            <div className="agent-status" style={{ opacity: currentStep === 2 ? 1 : 0.4 }}>
                                {currentStep === 2 ? <span className="typing-dot">Extracting</span> : 'Standby'}
                            </div>
                        </div>
                    </div>

                    <div className={`agent-card glass-panel fade-in ${(currentStep === 3 || currentStep === 4) ? 'active' : ''}`}>
                        <div className="agent-avatar" style={{ width: '50px', height: '50px' }}><PenTool size={24} /></div>
                        <div>
                            <h4 style={{ color: 'var(--warning)' }}>Copywriter</h4>
                            <div className="agent-status" style={{ opacity: (currentStep === 3 || currentStep === 4) ? 1 : 0.4 }}>
                                {(currentStep === 3 || currentStep === 4) ? <span className="typing-dot">Generating</span> : 'Standby'}
                            </div>
                        </div>
                    </div>

                    <div className={`agent-card glass-panel fade-in ${currentStep === 4 ? 'active' : ''}`}>
                        <div className="agent-avatar" style={{ width: '50px', height: '50px' }}><Search size={24} /></div>
                        <div>
                            <h4 style={{ color: 'var(--warning)' }}>NLP Validator</h4>
                            <div className="agent-status" style={{ opacity: currentStep === 4 ? 1 : 0.4 }}>
                                {currentStep === 4 ? <span className="typing-dot">Scanning</span> : 'Standby'}
                            </div>
                        </div>
                    </div>

                    <div className={`agent-card glass-panel fade-in ${currentStep === 5 ? 'active' : ''}`}>
                        <div className="agent-avatar" style={{ width: '50px', height: '50px' }}><ShieldCheck size={24} color="var(--success)" /></div>
                        <div>
                            <h4 style={{ color: 'var(--success)' }}>Editor-in-Chief</h4>
                            <div className="agent-status" style={{ opacity: currentStep === 5 ? 1 : 0.4 }}>
                                {currentStep === 5 ? <span className="typing-dot">Reviewing</span> : 'Standby'}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="feed-col">
                    <div className="chat-feed auto-scroll" style={{ height: '550px', display: 'flex', flexDirection: 'column' }}>
                        {logs.map(log => (
                            <div key={log.id} className={`chat-message ${log.type}`} style={{ color: log.color || 'inherit' }}>
                                {log.type === 'NLP Engine' && <Zap size={18} />}
                                {log.type === 'Agent 1' && <BrainCircuit size={18} />}
                                {log.type === 'Agent 2' && <PenTool size={18} />}
                                {log.type === 'Agent 3' && <ShieldCheck size={18} />}
                                <span style={{ fontSize: '14px', lineHeight: '1.4' }}>{log.msg}</span>
                            </div>
                        ))}
                        <div ref={feedEndRef} />
                        {currentStep === 6 && (
                            <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '24px' }} className="fade-in">
                                <button className="btn btn-primary" onClick={() => navigate('/review')}>
                                    View Final Campaign Layout <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function FinalReviewPage() {
    const { factSheet, outputs, setOutputs, saveCampaign } = React.useContext(AppContext);
    const [activeTab, setActiveTab] = useState('blog');
    const [devicePreview, setDevicePreview] = useState('desktop');
    const [feedback, setFeedback] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [refineLogs, setRefineLogs] = useState([]);
    const navigate = useNavigate();

    const handleCopyAll = () => {
        const flashcardsText = (outputs.flashcards || []).map((fc, i) => `Q${i + 1}: ${fc.q}\nA: ${fc.a}`).join('\n\n');
        const insightsText = (outputs.insights || []).map(ins => `• ${ins}`).join('\n');
        const textToCopy = `FACT SHEET:\nTarget Audience: ${factSheet?.audience}\nValue Proposition: ${factSheet?.valueProp}\nCore Features: ${factSheet?.features?.join(', ')}\n\nBLOG POST:\n${outputs.blog}\n\nSOCIAL THREAD:\n${outputs.social}\n\nEMAIL TEASER:\n${outputs.email}\n\nLINKEDIN POST:\n${outputs.linkedin}\n\nFLASHCARDS:\n${flashcardsText}\n\nKEY INSIGHTS:\n${insightsText}`;
        navigator.clipboard.writeText(textToCopy);
        alert('Copied entire campaign kit to clipboard!');
    };

    const handleExportZip = async () => {
        const zip = new JSZip();
        zip.file("fact-sheet.txt", `Target Audience: ${factSheet.audience}\nValue Proposition: ${factSheet.valueProp}\nCore Features: ${factSheet.features.join(', ')}`);
        zip.file("blog-post.md", outputs.blog);
        zip.file("social-thread.txt", outputs.social);
        zip.file("email-teaser.html", outputs.email);
        zip.file("linkedin-post.txt", outputs.linkedin);
        zip.file("instagram-captions.txt", (outputs.instagram || []).map((s, i) => `Slide ${i + 1}: ${s}`).join('\n'));
        zip.file("flashcards.txt", (outputs.flashcards || []).map((fc, i) => `Q${i + 1}: ${fc.q}\nA: ${fc.a}`).join('\n\n'));
        zip.file("key-insights.txt", (outputs.insights || []).map(ins => `• ${ins}`).join('\n'));
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "cymonic-campaign-kit.zip");
    };

    const handleRegenerate = () => {
        navigate('/agent-room');
    };

    const handleRefine = async () => {
        if (!feedback.trim()) return alert("Please enter feedback first.");
        setIsRefining(true);
        setRefineLogs([{ id: 'start', msg: `Sending feedback for ${activeTab}...`, type: 'system' }]);

        try {
            const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/refine';
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factSheet,
                    currentOutputs: outputs,
                    feedback,
                    targetTab: activeTab
                })
            });

            if (!response.ok) throw new Error("Server error during refinement");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const lines = decoder.decode(value).split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.substring(6));
                        if (data.type === 'log') {
                            setRefineLogs(prev => [...prev, { id: Date.now() + Math.random(), ...data.log }]);
                        } else if (data.type === 'refinementComplete') {
                            setOutputs(prev => ({ ...prev, ...data.data }));
                            setFeedback('');
                            setIsRefining(false);
                            alert(`${activeTab} has been refined!`);
                        } else if (data.type === 'error') {
                            alert("Error: " + data.error);
                            setIsRefining(false);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setIsRefining(false);
        }
    };

    if (!factSheet) {
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h2>No Campaign Data</h2>
                <a href="/" className="btn btn-primary" style={{ marginTop: '20px' }}>Go Back</a>
            </div>
        );
    }

    return (
        <div className="review-dashboard fade-in">
            <div className="glass-panel sidebar-panel">
                <h3 style={{ borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px', marginBottom: '8px' }}>
                    Extracted Fact-Sheet
                </h3>

                <div className="source-truth">
                    <p><strong>Product/Topic:</strong> {factSheet.product}</p>
                    <p><strong>Target Audience:</strong> {factSheet.audience}</p>
                    <p><strong>Detected Tone:</strong> <span style={{ background: 'var(--primary)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{factSheet.tone}</span></p>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '12px 0' }} />
                    <p><strong>Value Proposition:</strong><br />{factSheet.valueProp}</p>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '12px 0' }} />
                    <p><strong>Core Features:</strong></p>
                    <ul style={{ paddingLeft: '20px', marginTop: '4px', fontSize: '13px' }}>
                        {[...factSheet.features, ...factSheet.entities, ...factSheet.technical].filter(Boolean).slice(0, 5).map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCopyAll}>
                        <Copy size={16} /> Copy All
                    </button>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportZip}>
                        <Download size={16} /> Export ZIP
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px', flex: 1, position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div className="content-tabs">
                        {['blog', 'social', 'email', 'linkedin', 'instagram', 'flashcards', 'insights'].map(tab => (
                            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={`editor-view ${devicePreview === 'mobile' ? 'device-preview-mobile' : ''}`}>
                    <div className="editor-content" style={{ position: 'relative', minHeight: '400px' }}>
                        {activeTab === 'instagram' || activeTab === 'flashcards' || activeTab === 'insights' ? (
                            <div>Rendering {activeTab}...</div>
                        ) : (
                            <div contentEditable suppressContentEditableWarning style={{ outline: 'none', whiteSpace: 'pre-wrap' }}>
                                {outputs[activeTab]}
                            </div>
                        )}

                        {isRefining && (
                            <div className="refine-overlay fade-in" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', borderRadius: '12px' }}>
                                <div className="typing-dot" style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>Refining...</div>
                                <div className="chat-feed" style={{ width: '100%', maxHeight: '200px', overflowY: 'auto' }}>
                                    {refineLogs.map(log => <div key={log.id} style={{ fontSize: '12px', marginBottom: '4px' }}>{log.msg}</div>)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="feedback-section" style={{ marginTop: '20px', padding: '16px', borderTop: '1px solid var(--panel-border)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            type="text"
                            className="input-field"
                            placeholder={`Feedback for ${activeTab}...`}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleRefine} disabled={isRefining}>Apply</button>
                    </div>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={handleRegenerate}>Regenerate All</button>
                    <button className="btn btn-success" onClick={() => { saveCampaign({ id: Date.now(), factSheet, outputs, title: factSheet.product }); alert("Saved!"); }}>Approve Draft</button>
                </div>
            </div>
        </div>
    );
}

function HistoryPage() {
    const { campaignHistory, setFactSheet, setOutputs } = React.useContext(AppContext);
    const navigate = useNavigate();

    return (
        <div className="glass-panel fade-in" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <h2>History</h2>
            {campaignHistory.map(c => (
                <div key={c.id} style={{ padding: '20px', border: '1px solid #eee', marginBottom: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{c.title}</span>
                    <button onClick={() => { setFactSheet(c.factSheet); setOutputs(c.outputs); navigate('/review'); }}>View</button>
                </div>
            ))}
        </div>
    );
}

function AboutPage() {
    return <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}><h2>About CYMONIC</h2></div>;
}
