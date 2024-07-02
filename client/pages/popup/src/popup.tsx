import '@src/popup.css';
import { withErrorBoundary, withSuspense } from '@ai-community-notes/shared';

function Popup() {
  return (
    <div className="app">
      <header className="app-header">
        <img src={chrome.runtime.getURL('icon.svg')} className="app-logo" alt="logo" />
        <h1>AI Community Notes</h1>
      </header>
    </div>
  );
}

export default withErrorBoundary(withSuspense(Popup, <div> Loading ... </div>), <div> Error Occur </div>);
