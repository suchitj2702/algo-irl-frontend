import { DaySchedule, StudyPlanConfig } from '../types/studyPlan';
import { getAllProblems } from '../constants/blind75';

type DatasetType = StudyPlanConfig['datasetType'];

const BLIND75_SLUG_SET = new Set(getAllProblems().map(problem => problem.slug));

function isBlind75ProblemId(problemId?: string): boolean {
  if (!problemId) {
    return false;
  }
  return BLIND75_SLUG_SET.has(problemId);
}

export function isBlind75DailySchedule(dailySchedule: DaySchedule[] = []): boolean {
  let problemCount = 0;

  for (const day of dailySchedule) {
    for (const problem of day.problems) {
      problemCount += 1;
      if (!isBlind75ProblemId(problem.problemId)) {
        return false;
      }
    }
  }

  return problemCount > 0;
}

export function isBlind75StudyPlan(
  datasetType: DatasetType,
  dailySchedule: DaySchedule[] = []
): boolean {
  if (datasetType === 'blind75') {
    return true;
  }
  if (datasetType === 'full') {
    return false;
  }
  return isBlind75DailySchedule(dailySchedule);
}

export function normalizeStudyPlanDatasetType(
  config: StudyPlanConfig,
  dailySchedule: DaySchedule[] = []
): StudyPlanConfig {
  if (config.datasetType === 'blind75') {
    return config;
  }

  if (!config.datasetType && isBlind75DailySchedule(dailySchedule)) {
    return {
      ...config,
      datasetType: 'blind75'
    };
  }

  return config;
}
