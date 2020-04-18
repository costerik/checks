import type { IncomingHttpHeaders } from 'http';

export type UserType = {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  tosAgreement?: boolean;
  checks?: Array<string>;
};

export type QueryType = {
  id?: string;
  phone?: string;
};

export type DataType<T> = {
  headers: IncomingHttpHeaders;
  trimmedPath: string;
  method: string | undefined;
  payload: T;
  query: QueryType;
};

export type ErrorHandlerType = {
  error: string;
  errorMessage?: { err: NodeJS.ErrnoException | boolean; readData?: UserType | {} };
};

export type CallbackType<T = {}> = (statusCode: number, err?: T | ErrorHandlerType) => void;

export type TokenType = {
  phone?: string;
  id?: string;
  expires?: number;
  extend?: boolean;
};

export type CheckType = {
  phone?: string;
  id?: string;
  protocol?: string;
  url?: string;
  method?: string;
  timeoutSeconds?: number;
  successCode?: Array<number>;
};
