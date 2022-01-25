import React, { FC, ReactNode, useState } from 'react';

import { Error } from './Error';
import { Progress } from './Progress';
import { Success } from './Success';
import { TimeoutError } from './TimeoutError';

const TIMEOUT_TIME = 90 * 1000;

export interface RequestProps {
  readonly actionContent: (
    next: (request: Promise<any>) => void,
  ) => ReactNode | ReactNode[] | string;
  readonly progressContent: ReactNode | ReactNode[] | string;
  readonly timeoutContent: ReactNode | ReactNode[] | string;
  readonly errorContent:
    | ReactNode
    | ReactNode[]
    | string
    | ((result: any) => ReactNode | ReactNode[] | string);
  readonly successContent:
    | ReactNode
    | ReactNode[]
    | string
    | ((result: any) => ReactNode | ReactNode[] | string);
}

enum RequestState {
  ACTION,
  PROGRESS,
  ERROR,
  SUCCESS,
  TIMEOUT,
}

export const Request: FC<RequestProps> = ({
  progressContent,
  errorContent,
  successContent,
  timeoutContent,
  actionContent,
}) => {
  const [requestState, setRequestState] = useState<RequestState>(
    RequestState.ACTION,
  );
  const [result, setResult] = useState<any>(undefined);

  const handleRequest = (request: Promise<any>) => {
    setRequestState(RequestState.PROGRESS);
    Promise.race([
      request,
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new TimeoutError('yoroi issues')),
          TIMEOUT_TIME,
        );
      }),
    ])
      .then((result) => {
        setRequestState(RequestState.SUCCESS);
        setResult(result);
      })
      .catch((error) => {
        if (error.type === 'timeout') {
          setRequestState(RequestState.TIMEOUT);
        } else {
          setRequestState(RequestState.ERROR);
        }
        setResult(error);
      });
  };

  return (
    <>
      {requestState === RequestState.ACTION && actionContent(handleRequest)}
      {requestState === RequestState.PROGRESS && (
        <Progress content={progressContent} />
      )}
      {requestState === RequestState.ERROR && (
        <Error result={result} content={errorContent} />
      )}
      {requestState === RequestState.TIMEOUT && (
        <Error result={result} content={timeoutContent} />
      )}
      {requestState === RequestState.SUCCESS && (
        <Success result={result} content={successContent} />
      )}
    </>
  );
};
