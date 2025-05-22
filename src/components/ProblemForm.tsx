import { useState } from 'react';
import { SparklesIcon } from 'lucide-react';

export interface FormData {
  dataset: string;
  company: string;
  customCompany: string;
  difficulty: string;
}

interface ProblemFormProps {
  initialData: Omit<FormData, 'dataset'> & { dataset?: string };
  onSubmit: (data: FormData) => void;
}

export function ProblemForm({
  initialData,
  onSubmit
}: ProblemFormProps) {
  const [formData, setFormData] = useState<FormData>({...initialData, dataset: 'blind75'});
  
  const companies = [{
    id: 'openai',
    name: 'OpenAI'
  }, {
    id: 'google',
    name: 'Google'
  }, {
    id: 'amazon',
    name: 'Amazon'
  }, {
    id: 'microsoft',
    name: 'Microsoft'
  }, {
    id: 'meta',
    name: 'Meta'
  }, {
    id: 'custom',
    name: 'Custom Company'
  }];
  
  const difficulties = [{
    id: 'Easy',
    name: 'Easy'
  }, {
    id: 'Medium',
    name: 'Medium'
  }, {
    id: 'Hard',
    name: 'Hard'
  }];
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    onSubmit(formData);
  };
  
  return <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-850 rounded-lg shadow-medium p-6">
        <h2 className="text-xl font-medium text-neutral-750 dark:text-white text-center mb-6">
          Configure Your Problem
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-750 dark:text-neutral-200 mb-1">
              Dataset
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button 
                type="button" 
                className={'py-2 px-3 border rounded-md text-sm bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300 cursor-default'}
              >
                Blind 75
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-500 italic pl-1">
              More datasets coming soon...
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-750 dark:text-neutral-200 mb-1">
              Company
            </label>
            <div className="grid grid-cols-3 gap-2">
              {companies.map(company => <button key={company.id} type="button" onClick={() => {
                console.log(`Company selected: ${company.id}`);
                setFormData({
                  ...formData,
                  company: company.id
                });
              }} className={`py-2 px-3 border rounded-md text-sm ${formData.company === company.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>
                  {company.name}
                </button>)}
            </div>
            {formData.company === 'custom' && <input type="text" value={formData.customCompany} onChange={e => {
              console.log(`Custom company entered: ${e.target.value}`);
              setFormData({
                ...formData,
                customCompany: e.target.value
              });
            }} placeholder="Enter company name" className="mt-2 block w-full rounded-md border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-750 dark:text-neutral-200 mb-1">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map(difficulty => <button key={difficulty.id} type="button" onClick={() => {
                console.log(`Difficulty selected: ${difficulty.id}`);
                setFormData({
                  ...formData,
                  difficulty: difficulty.id
                });
              }} className={`py-2 px-3 border rounded-md text-sm ${formData.difficulty === difficulty.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>
                  {difficulty.name}
                </button>)}
            </div>
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              onClick={() => console.log("Submit button clicked")}
              className="w-full flex justify-center items-center px-4 py-2.5 text-base font-medium text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all duration-200 shadow-subtle hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={formData.company === 'custom' && !formData.customCompany?.trim()}
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              Generate Challenge
            </button>
          </div>
        </form>
      </div>
    </div>;
}