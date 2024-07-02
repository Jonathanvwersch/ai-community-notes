import { FactCheckShape } from './api';
import { ErrorShape } from './error';

export type FactCheckingInput = FactCheckShape | ErrorShape | { hasShowMoreLink: boolean };
