import { createRoot, Root } from 'react-dom/client';
import { FactCheckButton } from './components/factCheckButton';
import { FactCheckResponse } from './components/factCheckResponse';
import tailwindcssOutput from '../tailwind-output.css?inline';
import '../tailwind-input.css';
import { FactCheckingInput } from './types/factChecking';

const rootMap = new Map<HTMLElement, Root>();

function getTweetUrl(article: HTMLElement): string | null {
  const anchor = article.querySelector('a[href*="/status/"]');
  return anchor ? anchor.getAttribute('href') : null;
}

function getFactCheckFromStorage(tweetUrl: string): FactCheckingInput | null {
  const response = localStorage.getItem(tweetUrl);
  return response ? JSON.parse(response) : null;
}

function saveFactCheckToStorage(tweetUrl: string, response: FactCheckingInput): void {
  localStorage.setItem(tweetUrl, JSON.stringify(response));
}

function addFactCheckButton() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]') as NodeListOf<HTMLElement>;

  articles.forEach(article => {
    const actionGroup = article.querySelector(
      '[aria-label*="replies"][role="group"], [aria-label*="reply"][role="group"], [aria-label*="views"][role="group"], [aria-label*="view"][role="group"], [aria-label*="likes"][role="group"], [aria-label*="like"][role="group"]',
    );

    if (actionGroup && !actionGroup.querySelector('.fact-check-button-wrapper')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'fact-check-button-wrapper';
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';

      actionGroup.appendChild(wrapper);

      const rootIntoShadow = document.createElement('div');
      const shadowRoot = wrapper.attachShadow({ mode: 'open' });
      shadowRoot.appendChild(rootIntoShadow);

      /** Inject styles into shadow dom */
      const styleElement = document.createElement('style');
      styleElement.innerHTML = tailwindcssOutput;
      shadowRoot.appendChild(styleElement);

      // Container to render the response
      let responseContainer = article.querySelector('.fact-check-response-container') as HTMLDivElement;
      if (!responseContainer) {
        responseContainer = document.createElement('div');
        responseContainer.className = 'fact-check-response-container';
        actionGroup.parentElement?.appendChild(responseContainer);
        responseContainer.style.display = 'none';

        // Inject styles into shadow dom for response
        const responseStyleElement = document.createElement('style');
        responseStyleElement.innerHTML = tailwindcssOutput;
        responseContainer.appendChild(responseStyleElement);
      }

      const handleAfterFactCheckResponse = (response: FactCheckingInput) => {
        let responseRoot = rootMap.get(responseContainer);
        if (!responseRoot) {
          responseRoot = createRoot(responseContainer);
          rootMap.set(responseContainer, responseRoot);
        }
        responseRoot.render(<FactCheckResponse response={response} />);
        responseContainer.style.display = 'block';
        saveFactCheckToStorage(tweetUrl ?? '', response);
      };

      let buttonRoot = rootMap.get(rootIntoShadow);
      if (!buttonRoot) {
        buttonRoot = createRoot(rootIntoShadow);
        rootMap.set(rootIntoShadow, buttonRoot);
      }

      const tweetUri = getTweetUrl(article);
      const tweetUrl = tweetUri ? `https://twitter.com${tweetUri}` : null;
      const tweetText = article.innerText;

      const cachedResponse = tweetUrl ? getFactCheckFromStorage(tweetUrl) : null;
      if (cachedResponse) {
        handleAfterFactCheckResponse(cachedResponse);
      }

      buttonRoot.render(
        <FactCheckButton
          disabled={!!cachedResponse}
          tweetText={tweetText}
          tweetUrl={tweetUrl ?? ''}
          tweetHasShowMoreLink={!!article.querySelector('[data-testid="tweet-text-show-more-link"]')}
          onAfterFactCheckResponse={handleAfterFactCheckResponse}
        />,
      );
    }
  });
}

const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length || mutation.removedNodes.length) {
      addFactCheckButton();
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

addFactCheckButton(); // Initial call to add buttons
