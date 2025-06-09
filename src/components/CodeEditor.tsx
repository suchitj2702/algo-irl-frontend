'use client';

import { useState, useRef, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import type { UserPreferences } from '../data-types/user';

// Define the available languages and their labels
export const SUPPORTED_LANGUAGES = [
  { id: 'python', label: 'Python' }
];

// Define default editor options
const DEFAULT_OPTIONS: editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  lineNumbers: 'on' as const,
  roundedSelection: false,
  wordWrap: 'on',
  folding: true,
  fontSize: 14,
  tabSize: 2,
};

// Define available themes
export const EDITOR_THEMES = [
  { id: 'vs', label: 'Light' },
  { id: 'vs-dark', label: 'Dark' },
  { id: 'hc-black', label: 'High Contrast Dark' },
  { id: 'hc-light', label: 'High Contrast Light' },
];

export interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  height?: string;
  width?: string;
  preferences?: Partial<UserPreferences>;
}

export default function CodeEditor({
  code,
  language,
  onChange,
  height = '70vh',
  width = '100%',
  preferences,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorError, setEditorError] = useState(false);

  // Configure editor options based on user preferences
  const editorOptions = {
    ...DEFAULT_OPTIONS,
    fontSize: preferences?.fontSize || DEFAULT_OPTIONS.fontSize,
    tabSize: preferences?.tabSize || DEFAULT_OPTIONS.tabSize,
    lineNumbers: 'on' as const,
  };

  // Check if editor is initialized after a timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isEditorReady) {
        console.error('Monaco Editor failed to load within 3 seconds');
        setEditorError(true);
      }
    }, 5000); // Increased to 5 seconds for slower networks

    return () => clearTimeout(timer);
  }, [isEditorReady]);

  // Handle editor initialization
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);
    setEditorError(false);
  };

  // Get selected language
  const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.id === language) 
    || SUPPORTED_LANGUAGES[0];

  // Handle editor theme
  const theme = preferences?.codeEditorTheme || 'vs-dark';

  const handleRetry = () => {
    setEditorError(false);
    setIsEditorReady(false);
  };

  return (
    <div className="code-editor-container w-full h-full bg-neutral-900">
      {editorError ? (
        <div className="p-4 text-white">
          <div className="mb-4">
            <p className="mb-2">Editor failed to load. This might be due to:</p>
            <ul className="list-disc list-inside text-sm text-neutral-300 mb-4">
              <li>Network connectivity issues</li>
              <li>Browser security settings</li>
              <li>Content Security Policy restrictions</li>
            </ul>
            <button 
              onClick={handleRetry}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded mr-2"
            >
              Retry Loading Editor
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-neutral-600 hover:bg-neutral-700 text-white text-sm rounded"
            >
              Refresh Page
            </button>
          </div>
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-[calc(100%-120px)] p-4 font-mono text-sm bg-neutral-900 text-neutral-200 focus:outline-none resize-none border border-neutral-700"
            spellCheck="false"
            placeholder="// Fallback text editor - Monaco Editor failed to load"
          />
        </div>
      ) : (
        <Editor
          height={height}
          width={width}
          language={selectedLanguage.id}
          value={code}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          options={editorOptions}
          theme={theme}
          loading={<div className="editor-loading p-4 text-white">Loading Monaco Editor...</div>}
        />
      )}
    </div>
  );
} 