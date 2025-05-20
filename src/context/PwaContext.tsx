
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useToast } from "@/hooks/use-toast";

type NetworkStatus = 'online' | 'offline';

interface PwaContextType {
  networkStatus: NetworkStatus;
  installPrompt: Event | null;
  promptInstall: () => void;
  isStandalone: boolean;
  pendingOperations: Array<any>;
  addPendingOperation: (operation: any) => void;
  processPendingOperations: () => void;
  clearPendingOperations: () => void;
}

const PwaContext = createContext<PwaContextType>({
  networkStatus: 'online',
  installPrompt: null,
  promptInstall: () => {},
  isStandalone: false,
  pendingOperations: [],
  addPendingOperation: () => {},
  processPendingOperations: () => {},
  clearPendingOperations: () => {},
});

export const usePwa = () => useContext(PwaContext);

export const PwaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(navigator.onLine ? 'online' : 'offline');
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [pendingOperations, setPendingOperations] = useState<Array<any>>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the app is running in standalone mode (installed PWA)
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                             (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Network status change listeners
    const handleOnline = () => {
      setNetworkStatus('online');
      toast({
        title: "You're back online",
        description: "Syncing your data with the server...",
      });
      processPendingOperations();
    };
    
    const handleOffline = () => {
      setNetworkStatus('offline');
      toast({
        title: "You're offline",
        description: "Don't worry, you can still use the app. Changes will sync when you're back online.",
        variant: "destructive"
      });
    };

    // Install prompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Load pending operations from local storage
    const storedOperations = localStorage.getItem('pendingOperations');
    if (storedOperations) {
      setPendingOperations(JSON.parse(storedOperations));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Store pending operations when they change
  useEffect(() => {
    localStorage.setItem('pendingOperations', JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  const promptInstall = () => {
    if (installPrompt) {
      (installPrompt as any).prompt();
      (installPrompt as any).userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setInstallPrompt(null);
        } else {
          console.log('User dismissed the install prompt');
        }
      });
    }
  };

  const addPendingOperation = (operation: any) => {
    setPendingOperations(prev => [...prev, { ...operation, timestamp: new Date().toISOString() }]);
  };

  const processPendingOperations = async () => {
    if (networkStatus === 'offline' || pendingOperations.length === 0) return;
    
    // In a real app, this would use the Supabase API to process operations
    console.log('Processing pending operations:', pendingOperations);
    
    try {
      // Mock successful processing - in a real app, this would interact with your backend
      // Maybe use a queue or batched operations for efficiency
      
      // For now, we'll just simulate a success
      toast({
        title: "Sync complete",
        description: `Successfully synced ${pendingOperations.length} operations with the server.`,
      });
      
      clearPendingOperations();
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "We couldn't sync your changes with the server. We'll try again later.",
        variant: "destructive"
      });
    }
  };

  const clearPendingOperations = () => {
    setPendingOperations([]);
  };

  return (
    <PwaContext.Provider
      value={{
        networkStatus,
        installPrompt,
        promptInstall,
        isStandalone,
        pendingOperations,
        addPendingOperation,
        processPendingOperations,
        clearPendingOperations
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};
