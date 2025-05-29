import { useState, useEffect } from 'react';
import { SparklesIcon, BuildingIcon, ClockIcon } from 'lucide-react';
import { getRecentCompanies, CachedCompany } from '../utils/cache';

const CompanyIcon = () => (
  <BuildingIcon className="w-5 h-5" />
);

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
  const [formData, setFormData] = useState<FormData>({...initialData, dataset: 'blind75', company: 'custom'});
  const [recentCompanies, setRecentCompanies] = useState<CachedCompany[]>([]);
  
  useEffect(() => {
    const recent = getRecentCompanies();
    setRecentCompanies(recent);
  }, []);

  const companies = [{
    id: 'custom',
    name: 'Company Name',
    logo: CompanyIcon
  }, {
    id: 'meta',
    name: 'Meta'
  }, {
    id: 'apple',
    name: 'Apple'
  }, {
    id: 'amazon',
    name: 'Amazon'
  }, {
    id: 'netflix',
    name: 'Netflix'
  }, {
    id: 'google',
    name: 'Google'
  }, {
    id: 'microsoft',
    name: 'Microsoft'
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

  const selectCompany = (companyId: string, isCustom: boolean = false) => {
    console.log(`Company selected: ${companyId}`);
    setFormData({
      ...formData,
      company: companyId,
      customCompany: isCustom ? formData.customCompany : ''
    });
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
            <div className="space-y-2">
              {/* Recent Companies Section */}
              {recentCompanies.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1 mb-2">
                    <ClockIcon className="w-3 h-3 text-neutral-500" />
                    <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                      Recently Used
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {recentCompanies.map((recentCompany) => (
                      <button 
                        key={`recent-${recentCompany.id}`}
                        type="button" 
                        onClick={() => {
                          if (recentCompany.id === 'custom') {
                            setFormData({
                              ...formData,
                              company: 'custom',
                              customCompany: recentCompany.name
                            });
                          } else {
                            selectCompany(recentCompany.id);
                          }
                        }}
                        className={`py-2 px-3 border rounded-md text-sm flex items-center justify-center gap-1 ${
                          formData.company === recentCompany.id && 
                          (recentCompany.id !== 'custom' || formData.customCompany === recentCompany.name)
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' 
                            : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span className="truncate text-sm">
                          {recentCompany.name}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 dark:border-neutral-700 my-3"></div>
                </div>
              )}

              {/* Custom Company Input */}
              <button 
                type="button" 
                onClick={() => selectCompany('custom', true)} 
                className={`w-full py-2 px-3 border rounded-md text-sm flex items-center justify-center gap-2 ${formData.company === 'custom' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
              >
                <CompanyIcon />
                Company Name
              </button>
              {formData.company === 'custom' && (
                <input 
                  type="text" 
                  value={formData.customCompany} 
                  onChange={e => {
                    console.log(`Custom company entered: ${e.target.value}`);
                    setFormData({
                      ...formData,
                      customCompany: e.target.value
                    });
                  }} 
                  placeholder="Enter any company name" 
                  className="block w-full rounded-md border-gray-300 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" 
                />
              )}

              {/* Standard Companies */}
              <div className="grid grid-cols-3 gap-2">
                {companies.slice(1).map(company => {
                  return <button key={company.id} type="button" onClick={() => selectCompany(company.id)} className={`py-2 px-3 border rounded-md text-sm flex items-center justify-center gap-2 ${formData.company === company.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}>
                    {company.name}
                  </button>;
                })}
              </div>
            </div>
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