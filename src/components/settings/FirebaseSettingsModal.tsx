import React, { useState } from 'react';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  isFirebaseReady,
  testFirestoreConnection,
  FIRESTORE_PANELS_COLLECTION,
  type FirebaseConfig
} from '../../services/firebase';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Save,
  HelpCircle,
  Database,
  Copy,
  Check,
  Activity
} from 'lucide-react';

interface FirebaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const FirebaseSettingsModal: React.FC<FirebaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged
}) => {
  if (!isOpen) return null;

  const currentConfig = getSavedFirebaseConfig();
  const isConnected = isFirebaseReady();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');
  const [rawJson, setRawJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test Connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Copy states for security rules
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedStorageRules, setCopiedStorageRules] = useState(false);

  const firestoreRulesSnippet = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /${FIRESTORE_PANELS_COLLECTION}/{panelId} {
      allow read, write: if true;
    }
  }
}`;

  const storageRulesSnippet = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /${FIRESTORE_PANELS_COLLECTION}/{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;

  // Quick JSON paste parser
  const handleParseRawJson = () => {
    try {
      const cleaned = rawJson
        .replace(/const\s+firebaseConfig\s*=\s*/g, '')
        .replace(/;/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);

      setStatusMessage({
        type: 'success',
        text: 'Successfully extracted Firebase config keys!'
      });
    } catch (e) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid JSON format. Please paste the config object from Firebase console.'
      });
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testFirestoreConnection();
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to ping Firestore database'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (text: string, type: 'firestore' | 'storage') => {
    navigator.clipboard.writeText(text);
    if (type === 'firestore') {
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2000);
    } else {
      setCopiedStorageRules(true);
      setTimeout(() => setCopiedStorageRules(false), 2000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !projectId) {
      setStatusMessage({
        type: 'error',
        text: 'API Key and Project ID are required to connect to Firebase.'
      });
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    saveFirebaseConfig(config);
    setStatusMessage({
      type: 'success',
      text: 'Firebase cloud sync configured and connected!'
    });
    onConfigChanged();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDisconnect = () => {
    const confirm = window.confirm('Reset Firebase credentials? You will need to re-enter your Firebase keys to connect.');
    if (!confirm) return;

    saveFirebaseConfig(null);
    setApiKey('');
    setAuthDomain('');
    setProjectId('');
    setStorageBucket('');
    setMessagingSenderId('');
    setAppId('');
    setTestResult(null);
    setStatusMessage({
      type: 'success',
      text: 'Firebase credentials cleared. Please re-enter your Firebase project keys to connect.'
    });
    onConfigChanged();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">
              <Cloud className="cloud-icon" /> Firestore Database & Cloud Setup
            </h2>
            <p className="modal-subtitle">
              Configure Cloud Firestore to store and synchronize all lamination panels in real time between your Android phone and Mac.
            </p>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form-scrollable">
          {/* Status Indicator & Live Ping Test */}
          <div className={`sync-status-card ${isConnected ? 'status-connected' : 'status-pending'}`}>
            <div className="status-icon-wrapper">
              {isConnected ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div className="status-info" style={{ flex: 1 }}>
              <h4>{isConnected ? 'Firestore Cloud Online' : 'Firebase Credentials Required'}</h4>
              <p>
                {isConnected
                  ? `Connected to Firebase project "${currentConfig?.projectId}". All panels are stored in Firestore collection "${FIRESTORE_PANELS_COLLECTION}".`
                  : 'Enter your Firebase project details below to store panels in Cloud Firestore.'}
              </p>
            </div>
            {isConnected && (
              <button
                type="button"
                className="btn-header-secondary"
                style={{ alignSelf: 'center', whiteSpace: 'nowrap' }}
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                <Activity size={15} className={isTesting ? 'spin' : ''} />
                <span>{isTesting ? 'Testing...' : 'Test Database'}</span>
              </button>
            )}
          </div>

          {/* Test Connection Output */}
          {testResult && (
            <div className={`form-alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {statusMessage && (
            <div className={`form-alert alert-${statusMessage.type}`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Quick Paste Box */}
          <div className="quick-paste-box">
            <label className="form-label">
              ⚡ Quick Paste from Firebase Console (Paste entire firebaseConfig object):
            </label>
            <div className="paste-row">
              <textarea
                className="form-textarea quick-textarea"
                rows={2}
                placeholder='{ "apiKey": "AIzaSy...", "projectId": "my-factory-app", ... }'
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
              />
              <button
                type="button"
                className="btn-parse-json"
                onClick={handleParseRawJson}
                disabled={!rawJson.trim()}
              >
                Auto Fill
              </button>
            </div>
          </div>

          {/* Detailed Config Inputs */}
          <div className="config-fields-grid">
            <div className="form-group">
              <label className="form-label">API Key: <span className="req">*</span></label>
              <input
                type="text"
                className="form-input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Project ID: <span className="req">*</span></label>
              <input
                type="text"
                className="form-input"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="furniture-stock-app"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Storage Bucket:</label>
              <input
                type="text"
                className="form-input"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="furniture-stock-app.appspot.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Auth Domain:</label>
              <input
                type="text"
                className="form-input"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="furniture-stock-app.firebaseapp.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">App ID:</label>
              <input
                type="text"
                className="form-input"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Collection:</label>
              <input
                type="text"
                className="form-input"
                value={FIRESTORE_PANELS_COLLECTION}
                disabled
                style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
              />
            </div>
          </div>

          {/* Firestore Database Setup & Security Rules Guide */}
          <div className="form-section" style={{ background: '#f8fafc' }}>
            <div className="section-header" style={{ marginBottom: '0.6rem' }}>
              <Database size={17} />
              <h3>Firestore Database Setup & Security Rules</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '1rem' }}>
              In your Firebase Console, make sure <strong>Cloud Firestore</strong> is created. You can use these rules to allow read and write access to your lamination panels collection:
            </p>

            {/* Firestore Rules Codebox */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>
                  Firestore Rules (Firebase Console → Firestore Database → Rules):
                </span>
                <button
                  type="button"
                  className="btn-action-outline"
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                  onClick={() => handleCopy(firestoreRulesSnippet, 'firestore')}
                >
                  {copiedRules ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  <span>{copiedRules ? 'Copied!' : 'Copy Rule'}</span>
                </button>
              </div>
              <pre style={{
                background: '#0f172a',
                color: '#f8fafc',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                overflowX: 'auto'
              }}>
                {firestoreRulesSnippet}
              </pre>
            </div>

            {/* Storage Rules Codebox */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155' }}>
                  Storage Rules (Firebase Console → Storage → Rules):
                </span>
                <button
                  type="button"
                  className="btn-action-outline"
                  style={{ padding: '0.2rem 0.6rem', fontSize: '0.72rem' }}
                  onClick={() => handleCopy(storageRulesSnippet, 'storage')}
                >
                  {copiedStorageRules ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                  <span>{copiedStorageRules ? 'Copied!' : 'Copy Rule'}</span>
                </button>
              </div>
              <pre style={{
                background: '#0f172a',
                color: '#f8fafc',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                overflowX: 'auto'
              }}>
                {storageRulesSnippet}
              </pre>
            </div>
          </div>

          {/* Quick 30-second Help Guide */}
          <div className="firebase-guide-accordion">
            <div className="guide-header">
              <HelpCircle size={16} />
              <span>How to setup Firebase in 3 simple steps (100% Free):</span>
            </div>
            <ol className="guide-steps">
              <li>
                Open <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">console.firebase.google.com</a> & create or select your project.
              </li>
              <li>
                Under <strong>Build → Firestore Database</strong>, click <strong>Create Database</strong> (choose Native mode & location nearest to you).
              </li>
              <li>
                In <strong>Project Settings → General</strong>, scroll to <em>Your apps</em>, add a Web App (&lt;/&gt;), and paste the configuration above.
              </li>
            </ol>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            {isConnected && (
              <button
                type="button"
                className="btn-danger-outline"
                onClick={handleDisconnect}
              >
                <Trash2 size={16} />
                <span>Disconnect Cloud</span>
              </button>
            )}
            <div className="footer-right-cluster">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="submit" className="btn-primary">
                <Save size={16} />
                <span>Save & Connect Cloud</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
