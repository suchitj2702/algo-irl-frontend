import { useEffect } from 'react';
export function DatasetSelector({
  setSelectedDataset
}: {
  setSelectedDataset: (dataset: string) => void
}) {
  // Only keep Blind 75 and set it as selected
  useEffect(() => {
    setSelectedDataset('blind75');
  }, [setSelectedDataset]);
  return <div>
      <label className="block text-sm font-medium text-neutral-750 dark:text-neutral-200 mb-1">
        Problem Dataset
      </label>
      <div className="flex items-center">
        <input id="dataset-blind75" name="dataset" type="radio" checked={true} className="h-4 w-4 text-brand-primary border-gray-300 focus:ring-brand-primary" readOnly />
        <label htmlFor="dataset-blind75" className="ml-3">
          <span className="block text-sm font-medium text-neutral-750 dark:text-neutral-200">
            Blind 75
          </span>
          <span className="block text-sm text-neutral-600 dark:text-neutral-400">
            The famous collection of 75 essential algorithm problems
          </span>
        </label>
      </div>
      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-500 italic">
        Other datasets coming soon...
      </p>
    </div>;
}