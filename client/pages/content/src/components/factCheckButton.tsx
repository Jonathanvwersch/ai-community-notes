import React, { useCallback, useState, useEffect } from 'react';
import { performFactCheck } from '../api/performFactCheck';
import { FactCheckingInput } from '@src/types/factChecking';

type FactCheckButtonProps = {
  tweetText: string;
  tweetUrl: string;
  tweetUri: string;
  tweetDate: string;
  onAfterFactCheckResponse: (response: FactCheckingInput) => void;
  tweetHasShowMoreLink: boolean;
};

export const FactCheckButton: React.FC<FactCheckButtonProps> = ({
  tweetText,
  tweetUrl,
  tweetUri,
  tweetDate,
  onAfterFactCheckResponse,
  tweetHasShowMoreLink,
}) => {
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      // if (tweetHasShowMoreLink) {
      //   onAfterFactCheckResponse({ hasShowMoreLink: true });
      //   return;
      // }
      setLoading(true);
      try {
        const response = await performFactCheck(tweetText, tweetUrl, tweetDate);
        setDisabled(!('error' in response) && !('hasShowMoreLink' in response));
        onAfterFactCheckResponse(response);
      } catch (error) {
        onAfterFactCheckResponse({ error: true, message: 'Something went wrong. Please try again later.' });
      }
      setLoading(false);
    },
    [tweetText, tweetUrl, tweetDate, onAfterFactCheckResponse, tweetHasShowMoreLink],
  );

  useEffect(() => {
    const handleStorageChange = () => {
      const factCheck = localStorage.getItem(tweetUri);
      if (!factCheck) {
        setDisabled(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [tweetUri]);

  return (
    <div className="fact-check-button-wrapper flex items-center justify-center ml-1">
      <button
        className={`fact-check-button m-1 p-0 flex items-center justify-center h-fit w-fit border-none outline-none bg-transparent cursor-pointer ${loading ? 'spin' : ''} ${disabled ? 'opacity-75' : ''} ${disabled ? 'cursor-default' : ''}`}
        title="Fact check tweet with AI"
        onClick={handleClick}
        disabled={loading || disabled}>
        <img src={chrome.runtime.getURL('icon.svg')} alt="Fact Check" className="w-7 h-7" />
      </button>
    </div>
  );
};
