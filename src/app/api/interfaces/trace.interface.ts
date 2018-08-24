export enum TraceType {
  MACRO_START = 'MS',
  COMMENT = 'CMT',
  USER = 'USR',
  MACRO_END = 'ME',
}

export enum TraceLevel {
  DEBUG = 'DEBUG',
  ERROR = 'ERROR',
  TRACE = 'TRACE',
  WARN = 'WARN',
  INFO = 'INFO',
}

export interface TraceLocation {
  recipe: string;
  version: string;
  path: string;
}

export interface Trace {
  ctx: number;
  type: TraceType; //
  n: number;
  data: any;
  line: number;
  location: TraceLocation;
  owner: string;
  level: TraceLevel;
  ts: number;
  indent?: number; //niveau d'indentation dans l'arbre
  error?: boolean; //true if the macro ME has an non empty error array
  hasError?: boolean; //true if the calling MS will generate errors
}

export interface ErrorTrace {
  code: string;
  details: string;
  owner: string;
  ts: number;
  isExpanded?: boolean;
}

export interface StackTrace {
  name: string;
  owner: string;
  stack: Trace[];
  ts: number;
}

export interface TraceCompletion {
  data: Trace;
}

export interface TerminalTraces {
  traces: Trace[];
  collapseToggle: boolean;
}

const LOCATION_PATTERN = /^(.*)\|(.*)\:(.*)$/;

export const parseTraceLocation = (location): TraceLocation => {
  const [, recipe, version, path] = LOCATION_PATTERN.exec(location);
  return { recipe, version, path };
};
