export type Row = Record<string, unknown>;

export interface AppState {
  allRows:     Row[];
  columns:     string[];
  voltageCols: string[];
  curCol:      string;
  dataMin:     number;
  dataMax:     number;
  fMin:        number;
  fMax:        number;
  sortBars:    boolean;
}

export const state: AppState = {
  allRows:     [],
  columns:     [],
  voltageCols: [],
  curCol:      '',
  dataMin:     0,
  dataMax:     0,
  fMin:        0,
  fMax:        0,
  sortBars:    false,
};

export const STEPS         = 2000;
export const MAX_HEAT_ROWS = 400;
