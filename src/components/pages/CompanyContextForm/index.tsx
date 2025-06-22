import { useState, useEffect } from 'react';
import { BuildingIcon, ClockIcon, SparklesIcon } from 'lucide-react';
import { getRecentCompanies, CachedCompany } from '../../../utils/cache';

const CompanyIcon = () => (
  <BuildingIcon className="w-5 h-5" />
);

export interface CompanyContextFormData {
  company: string;
  customCompany: string;
}

interface CompanyContextFormProps {
  onSubmit: (data: CompanyContextFormData) => void;
  onCancel: () => void;
  problemSlug?: string;
}

export function CompanyContextForm({ onSubmit, onCancel, problemSlug }: CompanyContextFormProps) {
  const [formData, setFormData] = useState<CompanyContextFormData>({
    company: 'custom',
    customCompany: ''
  });
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectCompany = (companyId: string, isCustom: boolean = false) => {
    setFormData({
      ...formData,
      company: companyId,
      customCompany: isCustom ? formData.customCompany : ''
    });
  };

  // Helper function to convert slug to title
  const slugToTitle = (slug: string): string => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-850 rounded-lg shadow-medium p-6">
        <h2 className="text-xl font-medium text-neutral-750 dark:text-white text-center mb-2">
          Practice with Company Context
        </h2>
        {problemSlug ? (
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Selected problem:
            </p>
            <p className="font-medium text-indigo-600 dark:text-indigo-400">
              {slugToTitle(problemSlug)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            Get a random Blind75 problem with company-specific context
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="mt-2">
                  <input 
                    type="text" 
                    value={formData.customCompany} 
                    onChange={e => {
                      setFormData({
                        ...formData,
                        customCompany: e.target.value
                      });
                    }} 
                    placeholder="Type your company name here..." 
                    autoFocus
                    className="block w-full rounded-md border border-indigo-200 dark:border-indigo-700 bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:focus:ring-indigo-700 sm:text-sm px-3 py-2.5 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500" 
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    Enter any company name to get tailored questions
                  </p>
                </div>
              )}

              {/* Standard Companies */}
              <div className="grid grid-cols-3 gap-2">
                {companies.slice(1).map(company => {
                  return (
                    <button 
                      key={company.id} 
                      type="button" 
                      onClick={() => selectCompany(company.id)} 
                      className={`py-2 px-3 border rounded-md text-sm flex items-center justify-center gap-2 ${formData.company === company.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800'}`}
                    >
                      {company.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          <div className="pt-4 space-y-3">
            <button 
              type="submit" 
              className="w-full flex justify-center items-center px-4 py-2.5 text-base font-medium text-white bg-brand-primary hover:bg-brand-secondary rounded-lg transition-all duration-200 shadow-subtle hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={formData.company === 'custom' && !formData.customCompany?.trim()}
            >
              <SparklesIcon className="h-4 w-4 mr-2" />
              {problemSlug ? 'Get Contextualized Problem' : 'Get Random Problem'}
            </button>
            
            <button 
              type="button"
              onClick={onCancel}
              className="w-full px-4 py-2.5 text-base font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 