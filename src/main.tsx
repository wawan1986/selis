
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { useToast } from './hooks/use-toast';

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker for PWA support
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    const waitingServiceWorker = registration.waiting;
    
    if (waitingServiceWorker) {
      waitingServiceWorker.addEventListener("statechange", (event) => {
        // @ts-ignore
        if (event.target.state === "activated") {
          window.location.reload();
        }
      });
      waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
    }
  },
});
