import { useState, useRef } from 'react';
import {
    Download, Upload, Cloud, Monitor, Smartphone, Check, AlertCircle,
    ChevronDown, ChevronUp, HelpCircle, ArrowRight, FolderOpen, RefreshCw
} from 'lucide-react';
import { exportData, importData } from '../utils/db';

function Settings({ onRefresh }) {
    const [exportStatus, setExportStatus] = useState(null);
    const [importStatus, setImportStatus] = useState(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [tutorialStep, setTutorialStep] = useState(0);
    const fileInputRef = useRef(null);

    const handleExport = async () => {
        try {
            setExportStatus('exporting');
            const data = await exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setExportStatus('success');
            setTimeout(() => setExportStatus(null), 3000);
        } catch (error) {
            console.error('Export failed:', error);
            setExportStatus('error');
            setTimeout(() => setExportStatus(null), 3000);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImportStatus('importing');
            const text = await file.text();
            const count = await importData(text);
            onRefresh();
            setImportStatus(`Imported ${count} projects`);
            setTimeout(() => setImportStatus(null), 3000);
        } catch (error) {
            console.error('Import failed:', error);
            setImportStatus('error');
            setTimeout(() => setImportStatus(null), 3000);
        }

        e.target.value = '';
    };

    const tutorialSteps = [
        {
            title: "Step 1: Export your data",
            description: "Click the 'Export Data' button above. A JSON file will be downloaded to your computer with all your projects.",
            icon: Download,
            action: "Click Export Data ↑"
        },
        {
            title: "Step 2: Save to cloud storage",
            description: "Upload the downloaded JSON file to your cloud storage (Google Drive, Dropbox, OneDrive, iCloud, etc.)",
            icon: Cloud,
            action: "Upload to your cloud"
        },
        {
            title: "Step 3: Access from other device",
            description: "On your phone or other PC, open your cloud storage app and download the JSON backup file.",
            icon: Smartphone,
            action: "Download on other device"
        },
        {
            title: "Step 4: Import your data",
            description: "Open Video Manager on the new device, go to Settings, and click 'Import Data'. Select the JSON file you downloaded.",
            icon: Upload,
            action: "Click Import Data"
        },
        {
            title: "Done! Your data is synced",
            description: "All your projects are now available on both devices. Repeat this process whenever you want to sync changes.",
            icon: Check,
            action: "You're all set! 🎉"
        }
    ];

    return (
        <div className="page-container">
            <header style={{ marginBottom: 'var(--space-lg)' }}>
                <h1 className="header-title">Settings</h1>
            </header>

            {/* Data Management */}
            <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                    Data Management
                </h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
                    Export your projects as a JSON file for backup or to sync between devices.
                </p>

                <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={exportStatus === 'exporting'}
                        style={{ minWidth: 150 }}
                    >
                        {exportStatus === 'exporting' ? (
                            <>Exporting...</>
                        ) : exportStatus === 'success' ? (
                            <><Check /> Exported!</>
                        ) : (
                            <><Download /> Export Data</>
                        )}
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importStatus === 'importing'}
                        style={{ minWidth: 150 }}
                    >
                        {importStatus === 'importing' ? (
                            <>Importing...</>
                        ) : typeof importStatus === 'string' && importStatus.includes('Imported') ? (
                            <><Check /> {importStatus}</>
                        ) : importStatus === 'error' ? (
                            <><AlertCircle /> Import Failed</>
                        ) : (
                            <><Upload /> Import Data</>
                        )}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            {/* Sync Tutorial */}
            <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                    }}
                    onClick={() => setShowTutorial(!showTutorial)}
                >
                    <h2 style={{
                        fontSize: 'var(--font-size-lg)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)'
                    }}>
                        <HelpCircle style={{ color: 'var(--color-primary)' }} />
                        How to Sync Between Devices
                    </h2>
                    {showTutorial ? <ChevronUp /> : <ChevronDown />}
                </div>

                {showTutorial && (
                    <div style={{ marginTop: 'var(--space-lg)' }}>
                        {/* Progress bar */}
                        <div style={{
                            display: 'flex',
                            gap: 'var(--space-xs)',
                            marginBottom: 'var(--space-lg)'
                        }}>
                            {tutorialSteps.map((_, index) => (
                                <div
                                    key={index}
                                    style={{
                                        flex: 1,
                                        height: 4,
                                        borderRadius: 2,
                                        background: index <= tutorialStep ? 'var(--color-primary)' : 'var(--color-border)',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s ease'
                                    }}
                                    onClick={() => setTutorialStep(index)}
                                />
                            ))}
                        </div>

                        {/* Current step */}
                        <div style={{
                            background: 'var(--color-bg-tertiary)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-lg)',
                            marginBottom: 'var(--space-md)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                marginBottom: 'var(--space-md)'
                            }}>
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-primary-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {(() => {
                                        const Icon = tutorialSteps[tutorialStep].icon;
                                        return <Icon style={{ color: 'var(--color-primary)', width: 24, height: 24 }} />;
                                    })()}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600, marginBottom: 4 }}>
                                        {tutorialSteps[tutorialStep].title}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
                                        {tutorialSteps[tutorialStep].description}
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                padding: 'var(--space-sm) var(--space-md)',
                                background: 'var(--color-primary-light)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--color-primary)',
                                fontWeight: 500,
                                fontSize: 'var(--font-size-sm)',
                                display: 'inline-block'
                            }}>
                                👉 {tutorialSteps[tutorialStep].action}
                            </div>
                        </div>

                        {/* Navigation */}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setTutorialStep(Math.max(0, tutorialStep - 1))}
                                disabled={tutorialStep === 0}
                                style={{ opacity: tutorialStep === 0 ? 0.5 : 1 }}
                            >
                                ← Previous
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => setTutorialStep(Math.min(tutorialSteps.length - 1, tutorialStep + 1))}
                                disabled={tutorialStep === tutorialSteps.length - 1}
                                style={{ opacity: tutorialStep === tutorialSteps.length - 1 ? 0.5 : 1 }}
                            >
                                Next →
                            </button>
                        </div>

                        {/* Quick tips */}
                        <div style={{
                            marginTop: 'var(--space-lg)',
                            padding: 'var(--space-md)',
                            background: 'rgba(249, 115, 22, 0.1)',
                            borderRadius: 'var(--radius-md)',
                            borderLeft: '3px solid var(--color-primary)'
                        }}>
                            <strong style={{ color: 'var(--color-primary)' }}>💡 Pro Tips:</strong>
                            <ul style={{
                                color: 'var(--color-text-secondary)',
                                fontSize: 'var(--font-size-sm)',
                                marginTop: 'var(--space-sm)',
                                paddingLeft: 'var(--space-lg)'
                            }}>
                                <li style={{ marginBottom: 4 }}>Export regularly to keep your backup up-to-date</li>
                                <li style={{ marginBottom: 4 }}>Use a synced folder (Google Drive, Dropbox) for automatic access</li>
                                <li>Import replaces all existing data, so always export first!</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            {/* Installation Guide */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
                <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                    Install App
                </h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
                    Video Manager is a Progressive Web App (PWA). Install it for quick access!
                </p>

                <div style={{ display: 'grid', gap: 'var(--space-lg)', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                    {/* Desktop */}
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                            <Monitor style={{ color: 'var(--color-primary)' }} />
                            <h3 style={{ fontWeight: 600 }}>Desktop (Chrome/Edge)</h3>
                        </div>
                        <ol style={{
                            color: 'var(--color-text-secondary)',
                            paddingLeft: 'var(--space-lg)',
                            fontSize: 'var(--font-size-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-xs)'
                        }}>
                            <li>Look for the install icon ⊕ in the address bar</li>
                            <li>Or click ⋮ menu → "Install Video Manager"</li>
                            <li>Click "Install" to add to your apps</li>
                        </ol>
                    </div>

                    {/* Mobile */}
                    <div style={{
                        padding: 'var(--space-md)',
                        background: 'var(--color-bg-tertiary)',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                            <Smartphone style={{ color: 'var(--color-primary)' }} />
                            <h3 style={{ fontWeight: 600 }}>Mobile (iOS/Android)</h3>
                        </div>
                        <ol style={{
                            color: 'var(--color-text-secondary)',
                            paddingLeft: 'var(--space-lg)',
                            fontSize: 'var(--font-size-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-xs)'
                        }}>
                            <li>Tap the Share button (or ⋮ menu)</li>
                            <li>Select "Add to Home Screen"</li>
                            <li>Tap "Add" to confirm</li>
                        </ol>
                    </div>
                </div>
            </div>

            {/* App Info */}
            <div style={{
                marginTop: 'var(--space-lg)',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)'
            }}>
                <p>Video Manager v1.0.0</p>
                <p>Made with ❤️ for content creators</p>
            </div>
        </div>
    );
}

export default Settings;
