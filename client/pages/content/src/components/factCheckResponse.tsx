import { FactCheckingInput } from '@src/types/factChecking';
import React from 'react';

function Wrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="relative bg-white border border-gray-300 rounded-lg p-4 mt-6 shadow-sm">
      <div className="flex items-center mb-2 gap-2 border-b border-gray-300 pb-2">
        <img src={chrome.runtime.getURL('icon.svg')} alt="Fact Check" className="w-7 h-7" />
        <h3 className="font-bold text-gray-700">AI-added Context</h3>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          style={{ fontSize: '24px', lineHeight: '24px' }}>
          &times;
        </button>
      </div>
      <div className="text-gray-700 text-sm">{children}</div>
    </div>
  );
}

type FactCheckResponseProps = {
  response: FactCheckingInput;
  onClose: () => void;
};

export const FactCheckResponse: React.FC<FactCheckResponseProps> = ({ response, onClose }) => {
  if (!response) {
    return null;
  }

  if ('hasShowMoreLink' in response) {
    return (
      <Wrapper onClose={onClose}>
        <p className="mt-2">
          Our AI fact checker requires for the tweet to be expanded. Please click on the show more button below the
          tweet's text to expand the tweet and then try again.
        </p>
      </Wrapper>
    );
  }

  if ('error' in response) {
    return (
      <Wrapper onClose={onClose}>
        <p className="fact-check-response text-red-500 mt-2">{response.message}</p>
      </Wrapper>
    );
  }

  return (
    <Wrapper onClose={onClose}>
      {response.context && (
        <p className="mb-2">
          <strong>Context:</strong> {response.context}
        </p>
      )}
      <p className="mb-2 text-sm">
        <strong>Fact check:</strong> {response.factCheck}
      </p>
      {response.sources ? (
        <>
          <p>
            <strong>Sources:</strong>
          </p>
          <ul className="list-decimal pl-5">
            {response.sources?.map((source, index) => (
              <li key={index}>
                <a className="text-blue-600 break-all" target="_blank" href={source}>
                  {source}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="text-xs italic mt-4">
        Disclaimer: This fact check was generated using Perplexity AI and is not a substitute for human analysis. Please
        consult the sources. This widget is not in any way affiliated with the X/Twitter platform.
      </p>
    </Wrapper>
  );
};
