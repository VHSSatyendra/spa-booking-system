import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CalendarPage } from "@/pages/CalendarPage";
import { LoginPage } from "@/pages/LoginPage";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import { useEffect, useRef } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppContent() {
  const qc = useQueryClient();
  const { isAuthenticated, isLoading, error, signIn } = useAuth();
  const prevAuth = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !prevAuth.current) {
      qc.invalidateQueries();
    }
    prevAuth.current = isAuthenticated;
  }, [isAuthenticated, qc]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1F1E1D" }}>
        <div className="text-center">
          <div
            className="text-white font-bold text-3xl w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"
            style={{ backgroundColor: "#D97706" }}
          >
            N
          </div>
          <p className="text-gray-400 text-sm">Connecting...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={signIn} isLoading={isLoading} error={error} />;
  }

  return (
    <Switch>
      <Route path="/" component={() => <CalendarPage isAuthenticated={isAuthenticated} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
