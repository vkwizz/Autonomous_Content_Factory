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

        // Block binary formats — only plain text files are safe to readAsText
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

    return (
        <div className="glass-panel" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>Start a New Campaign</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Upload your raw source material—a technical document, product feature list, or a transcript. Our agents will take it from here.
            </p>

            <input
                ref={fileInputRef}
                id="file-input-hidden"
                type="file"
                accept=".txt,.md"
                style={{ display: 'none' }}
                onChange={handleFilePick}
            />
            <div
                className={`upload-zone ${isDragging ? 'drag-active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{ cursor: 'pointer' }}
            >
                <Upload className="upload-icon" />
                <h3 style={{ marginBottom: '8px' }}>Drag & Drop or Click to Upload</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>Supports .txt, .md files — or paste text below</p>
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
                    buffer = lines.pop(); // keep remainder
                    
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
                                        features: featuresList
                                    });
                                } else if (data.type === 'drafts') {
                                    setOutputs({
                                        blog: data.data.blog || data.data.blog_post || "",
                                        social: Array.isArray(data.data.social_thread) ? data.data.social_thread.join('\n\n') : (data.data.social_thread || data.data.social || ""),
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
    }, []); // run on mount only — works for both initial load and Regenerate navigation

    return (
        <div className="glass-panel" style={{ padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>The Agent Room</h2>
                <p style={{ color: 'var(--text-muted)' }}>Watch the Autonomous Factory collaborate in real-time.</p>
            </div>

            <div className="agent-grid">
                <div className={`agent-card glass-panel ${currentStep === 1 ? 'active' : ''}`} style={{ color: 'var(--primary)' }}>
                    <div className="agent-avatar"><Zap /></div>
                    <h3>NLP Preprocessor</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Text Cleanup</p>
                    <div className="agent-status" style={{ opacity: currentStep === 1 ? 1 : 0.3 }}>
                        {currentStep === 1 ? 'Parsing...' : 'Standby'}
                    </div>
                </div>

                <div className={`agent-card glass-panel ${currentStep === 2 ? 'active' : ''}`} style={{ color: 'var(--primary)' }}>
                    <div className="agent-avatar"><BrainCircuit /></div>
                    <h3>Lead Research</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Fact Extractor</p>
                    <div className="agent-status" style={{ opacity: currentStep === 2 ? 1 : 0.3 }}>
                        {currentStep === 2 ? 'Analyzing...' : 'Standby'}
                    </div>
                </div>

                <div className={`agent-card glass-panel ${currentStep === 3 ? 'active' : ''}`} style={{ color: 'var(--warning)' }}>
                    <div className="agent-avatar"><PenTool /></div>
                    <h3>Copywriter</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>The Voice</p>
                    <div className="agent-status" style={{ opacity: currentStep === 3 ? 1 : 0.3 }}>
                        {currentStep === 3 ? 'Drafting...' : 'Standby'}
                    </div>
                </div>

                <div className={`agent-card glass-panel ${currentStep === 4 ? 'active' : ''}`} style={{ color: 'var(--warning)' }}>
                    <div className="agent-avatar"><Search /></div>
                    <h3>NLP Validator</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Keyword Matcher</p>
                    <div className="agent-status" style={{ opacity: currentStep === 4 ? 1 : 0.3 }}>
                        {currentStep === 4 ? 'Auditing...' : 'Standby'}
                    </div>
                </div>

                <div className={`agent-card glass-panel ${currentStep === 5 ? 'active' : ''}`} style={{ color: 'var(--success)' }}>
                    <div className="agent-avatar"><ShieldCheck /></div>
                    <h3>Editor-in-Chief</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Gatekeeper</p>
                    <div className="agent-status" style={{ opacity: currentStep === 5 ? 1 : 0.3 }}>
                        {currentStep === 5 ? 'Final Review...' : 'Standby'}
                    </div>
                </div>
            </div>

            <div className="chat-feed auto-scroll">
                {logs.map(log => (
                    <div key={log.id} className={`chat-message ${log.type}`} style={{ color: log.color || 'inherit' }}>
                        {log.type === 'NLP Engine' && <Zap size={18} />}
                        {log.type === 'Agent 1' && <BrainCircuit size={18} />}
                        {log.type === 'Agent 2' && <PenTool size={18} />}
                        {log.type === 'Agent 3' && <ShieldCheck size={18} />}
                        <span style={{ fontSize: '14px', lineHeight: '1.4' }}>{log.msg}</span>
                    </div>
                ))}
                {currentStep === 6 && (
                    <div style={{ textAlign: 'center', marginTop: '24px' }} className="fade-in">
                        <button className="btn btn-primary" onClick={() => navigate('/review')}>
                            View Final Campaign Layout <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function FinalReviewPage() {
    const { factSheet, outputs, saveCampaign } = React.useContext(AppContext);
    const [activeTab, setActiveTab] = useState('blog');
    const [devicePreview, setDevicePreview] = useState('desktop');
    const navigate = useNavigate();

    const handleCopyAll = () => {
        const flashcardsText = (outputs.flashcards || []).map((fc, i) => `Q${i+1}: ${fc.q}\nA: ${fc.a}`).join('\n\n');
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
        zip.file("instagram-captions.txt", (outputs.instagram || []).map((s, i) => `Slide ${i+1}: ${s}`).join('\n'));
        zip.file("flashcards.txt", (outputs.flashcards || []).map((fc, i) => `Q${i+1}: ${fc.q}\nA: ${fc.a}`).join('\n\n'));
        zip.file("key-insights.txt", (outputs.insights || []).map(ins => `• ${ins}`).join('\n'));
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, "cymonic-campaign-kit.zip");
    };

    const handleRegenerate = () => {
        navigate('/agent-room');
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
                    <p><strong>Target Audience:</strong><br />{factSheet.audience}</p>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '12px 0' }} />
                    <p><strong>Value Proposition:</strong><br />{factSheet.valueProp}</p>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--panel-border)', margin: '12px 0' }} />
                    <p><strong>Core Features:</strong></p>
                    <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                        {factSheet.features.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCopyAll}>
                        <Copy size={16} /> Copy All to Clipboard
                    </button>
                    <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleExportZip}>
                        <Download size={16} /> Export Kit (.zip)
                    </button>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="content-tabs" style={{ flexWrap: 'wrap', gap: '4px' }}>
                        <button className={`tab-btn ${activeTab === 'blog' ? 'active' : ''}`} onClick={() => setActiveTab('blog')}>
                            <FileText size={15} /> Blog
                        </button>
                        <button className={`tab-btn ${activeTab === 'social' ? 'active' : ''}`} onClick={() => setActiveTab('social')}>
                            <MessageSquare size={15} /> Twitter
                        </button>
                        <button className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`} onClick={() => setActiveTab('email')}>
                            <Mail size={15} /> Email
                        </button>
                        <button className={`tab-btn ${activeTab === 'linkedin' ? 'active' : ''}`} onClick={() => setActiveTab('linkedin')}>
                            <Briefcase size={15} /> LinkedIn
                        </button>
                        <button className={`tab-btn ${activeTab === 'instagram' ? 'active' : ''}`} onClick={() => setActiveTab('instagram')}>
                            <Camera size={15} /> Instagram
                        </button>
                        <button className={`tab-btn ${activeTab === 'flashcards' ? 'active' : ''}`} onClick={() => setActiveTab('flashcards')}>
                            <BookOpen size={15} /> Flashcards
                        </button>
                        <button className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`} onClick={() => setActiveTab('insights')}>
                            <Lightbulb size={15} /> Insights
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.04)', padding: '4px', borderRadius: '8px' }}>
                        <button
                            className={`btn ${devicePreview === 'desktop' ? '' : 'btn-secondary'}`}
                            style={{ background: devicePreview === 'desktop' ? 'var(--panel-bg)' : 'transparent', border: 'none' }}
                            onClick={() => setDevicePreview('desktop')}
                        >
                            <Monitor size={18} />
                        </button>
                        <button
                            className={`btn ${devicePreview === 'mobile' ? '' : 'btn-secondary'}`}
                            style={{ background: devicePreview === 'mobile' ? 'var(--panel-bg)' : 'transparent', border: 'none' }}
                            onClick={() => setDevicePreview('mobile')}
                        >
                            <Smartphone size={18} />
                        </button>
                    </div>
                </div>

                <div className={`editor-view fade-in ${devicePreview === 'mobile' ? 'device-preview-mobile' : ''}`}>
                    <div className="editor-header">
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f56' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#27c93f' }}></div>
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            {activeTab === 'blog' ? 'blog-post.md' : activeTab === 'social' ? 'thread.txt' : activeTab === 'email' ? 'email-teaser.html' : activeTab === 'linkedin' ? 'linkedin-post.txt' : activeTab === 'instagram' ? 'instagram-captions.txt' : activeTab === 'flashcards' ? 'flashcards.txt' : 'key-insights.txt'}
                        </span>
                        <div></div>
                    </div>
                    <div className="editor-content">
                        {activeTab === 'instagram' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {(outputs.instagram || []).map((slide, i) => (
                                    <div key={i} style={{ padding: '16px', background: 'linear-gradient(135deg, #667eea22, #764ba222)', border: '1px solid #667eea44', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ minWidth: '36px', height: '36px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '700', fontSize: '14px' }}>{i + 1}</div>
                                        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{slide}</p>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'flashcards' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {(outputs.flashcards || []).map((card, i) => (
                                    <div key={i} style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                                        <div style={{ padding: '12px 16px', background: 'var(--primary)', color: 'white', fontWeight: '600', fontSize: '13px' }}>Q{i + 1}: {card.q}</div>
                                        <div style={{ padding: '12px 16px', background: '#f8f9ff', fontSize: '14px', lineHeight: '1.6', color: 'var(--text)' }}>→ {card.a}</div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'insights' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(outputs.insights || []).map((insight, i) => (
                                    <div key={i} style={{ padding: '14px 18px', background: '#f0f4ff', borderLeft: '4px solid var(--primary)', borderRadius: '0 8px 8px 0', fontSize: '14px', lineHeight: '1.5' }}>
                                        <span style={{ marginRight: '8px', color: 'var(--primary)', fontWeight: '700' }}>•</span>{insight}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div contentEditable suppressContentEditableWarning style={{ outline: 'none', whiteSpace: 'pre-wrap' }}>
                                {outputs[activeTab]}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                    <button className="btn btn-secondary" onClick={handleRegenerate}>
                        <RefreshCcw size={16} /> Regenerate
                    </button>
                    <button 
                        className="btn btn-success"
                        onClick={() => {
                            const newCampaign = {
                                id: Date.now(),
                                date: new Date().toISOString(),
                                factSheet,
                                outputs,
                                title: factSheet.valueProp || "New Campaign"
                            };
                            saveCampaign(newCampaign);
                            alert("Campaign saved to history!");
                        }}
                    >
                        <CheckCircle size={16} /> Approve Draft
                    </button>
                </div>
            </div>
        </div>
    );
}

function HistoryPage() {
    const { campaignHistory, setFactSheet, setOutputs } = React.useContext(AppContext);
    const navigate = useNavigate();

    const handleView = (campaign) => {
        setFactSheet(campaign.factSheet);
        setOutputs(campaign.outputs);
        navigate('/review');
    };

    return (
        <div className="glass-panel fade-in" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>Campaign History</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                Your past generated campaigns and content assets.
            </p>
            {campaignHistory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>No campaigns saved yet. Generate one and approve it to see it here!</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {campaignHistory.map(campaign => (
                        <div key={campaign.id} className="fade-in" style={{ padding: '24px', border: '1px solid var(--panel-border)', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
                            <div style={{ textAlign: 'left' }}>
                                <h4 style={{ fontSize: '16px', marginBottom: '4px' }}>{campaign.title}</h4>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    Generated on {new Date(campaign.date).toLocaleDateString()}
                                </p>
                            </div>
                            <button className="btn btn-secondary" onClick={() => handleView(campaign)}>View Assets</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AboutPage() {
    return (
        <div className="glass-panel fade-in" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', background: 'white', borderRadius: '16px', border: '1px solid var(--panel-border)' }}>
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Cymonic Logo" style={{ height: '56px', width: '56px' }} />
            </div>
            <h2 style={{ marginBottom: '16px', fontSize: '28px' }}>About CYMONIC</h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
                We are building the future of autonomous content generation. 
                By combining advanced edge computing with multi-agent intelligence, we remove the friction from creating high-converting marketing campaigns.
            </p>
            <button className="btn btn-primary">Join our Team</button>
        </div>
    );
}
