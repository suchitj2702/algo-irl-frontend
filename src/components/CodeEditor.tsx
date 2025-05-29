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
        setEditorError(true);
      }
    }, 3000); // 3 seconds

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

  return (
    <div className="code-editor-container w-full h-full bg-neutral-900">
      {editorError ? (
        <div className="p-4 text-white">
          <p>Editor failed to load. You may need to refresh the page.</p>
          <textarea
            value={code}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-[calc(100%-30px)] p-4 font-mono text-sm bg-neutral-900 text-neutral-200 focus:outline-none resize-none border border-neutral-700 mt-2"
            spellCheck="false"
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
          loading={<div className="editor-loading p-4 text-white">Loading editor...</div>}
        />
      )}
    </div>
  );
} 