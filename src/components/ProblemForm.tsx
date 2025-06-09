import { useState, useEffect } from 'react';
import { SparklesIcon, BuildingIcon, ClockIcon } from 'lucide-react';
import { getRecentCompanies, CachedCompany, getProblemShowTimestamps, updateProblemShowTimestamp } from '../utils/cache';
import { blind75Data, TopicName, getTopicNames, getAllProblems, getProblemsByTopic } from '../constants/blind75';

const CompanyIcon = () => (
  <BuildingIcon className="w-5 h-5" />
);

export interface FormData {
  dataset: string;
  company: string;
  customCompany: string;
  difficulty: string;
  topic: string;
  specificProblemSlug?: string;
}

interface ProblemFormProps {
  initialData: Omit<FormData, 'dataset'> & { dataset?: string };
  onSubmit: (data: FormData) => void;
}

export function ProblemForm({
  initialData,
  onSubmit
}: ProblemFormProps) {
  const [formData, setFormData] = useState<FormData>({
    dataset: initialData.dataset || 'blind75',
    company: initialData.company || 'custom', 
    topic: initialData.topic || 'random',
    customCompany: initialData.customCompany || '',
    difficulty: initialData.difficulty || 'Medium',
    specificProblemSlug: initialData.specificProblemSlug
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

  const topics = [
    { id: 'random', name: 'Random' },
    ...getTopicNames().map(topic => ({ id: topic, name: topic }))
  ];

  // Function to get least recently shown problem
  const getLeastRecentlyShownProblem = () => {
    let problemPool: Array<{ slug: string; difficulty: string }> = [];
    
    if (formData.topic === 'random') {
      problemPool = getAllProblems();
    } else {
      problemPool = getProblemsByTopic(formData.topic as TopicName);
    }

    // Filter by difficulty if specified
    if (formData.difficulty) {
      problemPool = problemPool.filter(p => p.difficulty === formData.difficulty);
    }

    if (problemPool.length === 0) return null;

    const timestamps = getProblemShowTimestamps();
    
    // Find problems that have never been shown
    const neverShownProblems = problemPool.filter(p => 
      !timestamps.find(t => t.slug === p.slug)
    );
    
    if (neverShownProblems.length > 0) {
      // If there are problems that have never been shown, pick one randomly
      const randomIndex = Math.floor(Math.random() * neverShownProblems.length);
      return neverShownProblems[randomIndex];
    }

    // All problems have been shown, find the least recently shown ones
    const problemsWithTimestamps = problemPool.map(p => {
      const timestamp = timestamps.find(t => t.slug === p.slug);
      return {
        ...p,
        timestamp: timestamp ? timestamp.lastShown : 0
      };
    }).sort((a, b) => a.timestamp - b.timestamp);

    // Find all problems with the minimum timestamp (least recently shown)
    const minTimestamp = problemsWithTimestamps[0].timestamp;
    const leastRecentlyShown = problemsWithTimestamps.filter(p => p.timestamp === minTimestamp);

    // If multiple problems have the same minimum timestamp, pick one randomly
    const randomIndex = Math.floor(Math.random() * leastRecentlyShown.length);
    return leastRecentlyShown[randomIndex];
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the least recently shown problem
    const selectedProblem = getLeastRecentlyShownProblem();
    
    if (!selectedProblem) {
      console.error("No problems found for the selected criteria");
      return;
    }

    // Update the timestamp for the selected problem
    updateProblemShowTimestamp(selectedProblem.slug);
    
    const finalFormData = {
      ...formData,
      specificProblemSlug: selectedProblem.slug
    };
    
    console.log("Form submitted with data:", finalFormData);
    console.log("Selected problem:", selectedProblem);
    onSubmit(finalFormData);
  };

  const selectCompany = (companyId: string, isCustom: boolean = false) => {
    console.log(`Company selected: ${companyId}`);
    setFormData({
      ...formData,
      company: companyId,
      customCompany: isCustom ? formData.customCompany : ''
    });
  };
  
  return <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-neutral-850 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
            Configure Your Problem
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Customize your coding challenge experience
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Dataset
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button 
                type="button" 
                className={'py-2.5 px-3 border rounded-lg text-sm font-medium bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300 cursor-default'}
              >
                Blind 75
              </button>
            </div>
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-2">
                💡 <strong>What is Blind 75?</strong> A curated list of 75 essential coding problems covering all major algorithms and data structures. Perfect for efficient interview preparation at top tech companies.
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 italic pl-1">
                More datasets coming soon...
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
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
                className={`w-full py-2.5 px-3 border rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-sm ${formData.company === 'custom' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600'}`}
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
                      console.log(`Custom company entered: ${e.target.value}`);
                      setFormData({
                        ...formData,
                        customCompany: e.target.value
                      });
                    }} 
                    placeholder="Enter your company name..." 
                    autoFocus
                    className="block w-full rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700/50 sm:text-sm px-4 py-3 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500" 
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                    Enter any company name to get tailored questions
                  </p>
                </div>
              )}

              {/* Standard Companies */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {companies.slice(1).map(company => {
                  return <button key={company.id} type="button" onClick={() => selectCompany(company.id)} className={`py-2.5 px-3 border rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm ${formData.company === company.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600'}`}>
                    <span className="truncate">{company.name}</span>
                  </button>;
                })}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map(difficulty => <button key={difficulty.id} type="button" onClick={() => {
                console.log(`Difficulty selected: ${difficulty.id}`);
                setFormData({
                  ...formData,
                  difficulty: difficulty.id
                });
              }} className={`py-2.5 px-3 border rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm ${formData.difficulty === difficulty.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600'}`}>
                  {difficulty.name}
                </button>)}
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Topic
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {topics.map(topic => (
                <button 
                  key={topic.id} 
                  type="button" 
                  onClick={() => {
                    console.log(`Topic selected: ${topic.id}`);
                    setFormData({
                      ...formData,
                      topic: topic.id
                    });
                  }} 
                  className={`py-2 px-3 border rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-sm flex items-center justify-center gap-2 ${
                    formData.topic === topic.id 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-300' 
                      : 'border-gray-300 text-neutral-750 dark:border-neutral-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600'
                  }`}
                >
                  {topic.id === 'random' && (
                    <SparklesIcon className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate text-xs">
                    {topic.name}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-2">
              <p className="text-xs text-gray-500 dark:text-gray-500 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-2">
                💡 <strong>Smart Selection:</strong> We'll automatically pick the least recently solved problem from your selected topic to ensure balanced practice.
              </p>
            </div>
          </div>
          <div className="pt-4">
            <button 
              type="submit" 
              onClick={() => console.log("Submit button clicked")}
              className="w-full flex justify-center items-center px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={formData.company === 'custom' && !formData.customCompany?.trim()}
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Generate Challenge
            </button>
          </div>
        </form>
      </div>
    </div>;
}