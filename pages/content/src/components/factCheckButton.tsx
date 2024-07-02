import React, { useCallback, useState } from 'react';
import { performFactCheck } from '../api/performFactCheck';
import { FactCheckingInput } from '@src/types/factChecking';

type FactCheckButtonProps = {
  tweetText: string;
  tweetUrl: string;
  onAfterFactCheckResponse: (response: FactCheckingInput) => void;
  tweetHasShowMoreLink: boolean;
};

export const FactCheckButton: React.FC<FactCheckButtonProps> = ({
  tweetText,
  tweetUrl,
  onAfterFactCheckResponse,
  tweetHasShowMoreLink,
}) => {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (tweetHasShowMoreLink) {
        onAfterFactCheckResponse({ hasShowMoreLink: true });
        return;
      }
      setLoading(true);
      try {
        const response = await performFactCheck(tweetText, tweetUrl);
        onAfterFactCheckResponse(response);
      } catch (error) {
        onAfterFactCheckResponse({ error: true, message: 'Something went wrong. Please try again later.' });
      }
      setLoading(false);
    },
    [tweetText],
  );

  return (
    <div className="fact-check-button-wrapper flex items-center justify-center ml-1">
      <button
        className={`fact-check-button m-1 p-0 flex items-center justify-center h-fit w-fit border-none outline-none bg-transparent cursor-pointer ${loading ? 'spin' : ''}`}
        title="Fact check tweet with AI"
        onClick={handleClick}
        disabled={loading}>
        <img src={chrome.runtime.getURL('icon.svg')} alt="Fact Check" className="w-7 h-7" />
      </button>
    </div>
  );
};
