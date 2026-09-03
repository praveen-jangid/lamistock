import React, { useState, useEffect } from 'react';
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

  // Sync state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const savedConfig = getSavedFirebaseConfig();
      setApiKey(savedConfig?.apiKey || '');
      setAuthDomain(savedConfig?.authDomain || '');
      setProjectId(savedConfig?.projectId || '');
      setStorageBucket(savedConfig?.storageBucket || '');
      setMessagingSenderId(savedConfig?.messagingSenderId || '');
      setAppId(savedConfig?.appId || '');
      setRawJson('');
      setStatusMessage(null);
      setTestResult(null);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 m-0 flex items-center gap-2">
              <Cloud className="text-emerald-600" size={20} /> Firestore Database & Cloud Setup
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure Cloud Firestore to store and synchronize all lamination panels in real time between your Android phone and Mac.
            </p>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
          {/* Status Indicator & Live Ping Test */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 flex-wrap ${
              isConnected
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/70 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              {isConnected ? (
                <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle size={24} className="text-amber-600 flex-shrink-0" />
              )}
              <div>
                <h4 className="text-sm font-extrabold m-0">
                  {isConnected ? 'Firestore Cloud Online' : 'Firebase Credentials Required'}
                </h4>
                <p className="text-xs opacity-90 mt-0.5 mb-0">
                  {isConnected
                    ? `Connected to project "${currentConfig?.projectId}". Panels sync to collection "${FIRESTORE_PANELS_COLLECTION}".`
                    : 'Enter your Firebase project details below to store panels in Cloud Firestore.'}
                </p>
              </div>
            </div>

            {isConnected && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer"
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                <Activity size={14} className={isTesting ? 'animate-spin' : ''} />
                <span>{isTesting ? 'Testing...' : 'Test Database'}</span>
              </button>
            )}
          </div>

          {/* Test Connection Output */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.message}</span>
            </div>
          )}

          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Quick Paste Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              ⚡ Quick Paste from Firebase Console (Paste entire firebaseConfig object):
            </label>
            <div className="flex gap-2">
              <textarea
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                rows={2}
                placeholder='{ "apiKey": "AIzaSy...", "projectId": "my-factory-app", ... }'
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
              />
              <button
                type="button"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition self-center cursor-pointer shadow-xs disabled:opacity-50"
                onClick={handleParseRawJson}
                disabled={!rawJson.trim()}
              >
                Auto Fill
              </button>
            </div>
          </div>

          {/* Detailed Config Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                API Key: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Project ID: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="furniture-stock-app"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Storage Bucket:</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                value={storageBucket}
                onChange={(e) => setStorageBucket(e.target.value)}
                placeholder="furniture-stock-app.appspot.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Auth Domain:</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="furniture-stock-app.firebaseapp.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">App ID:</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Collection:</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 font-mono cursor-not-allowed"
                value={FIRESTORE_PANELS_COLLECTION}
                disabled
              />
            </div>
          </div>

          {/* Firestore Database Setup & Security Rules Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Database size={16} className="text-emerald-600" />
              <span>Firestore Security Rules (Copy & Paste to Firebase Console)</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Firestore Rules (Firebase Console → Firestore Database → Rules):</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  onClick={() => handleCopy(firestoreRulesSnippet, 'firestore')}
                >
                  {copiedRules ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedRules ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
                {firestoreRulesSnippet}
              </pre>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span>Storage Rules (Firebase Console → Storage → Rules):</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  onClick={() => handleCopy(storageRulesSnippet, 'storage')}
                >
                  {copiedStorageRules ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedStorageRules ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto">
                {storageRulesSnippet}
              </pre>
            </div>
          </div>

          {/* Quick 30-second Help Guide */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <HelpCircle size={15} />
              <span>Setup Firebase in 3 simple steps (100% Free):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 pl-1">
              <li>Open console.firebase.google.com & create a free project.</li>
              <li>Under Build → Firestore Database, click Create Database (choose test mode or paste rule).</li>
              <li>Under Project Settings → General, register a Web App and paste the keys above.</li>
            </ol>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
            {isConnected ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                onClick={handleDisconnect}
              >
                <Trash2 size={13} />
                <span>Disconnect</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                onClick={onClose}
              >
                Close
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Save size={14} />
                <span>Save & Connect Cloud</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
