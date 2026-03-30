import { useEffect } from "react";

interface LoginPageProps {
  onLogin: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginPage({ onLogin, isLoading, error }: LoginPageProps) {
  useEffect(() => {
    onLogin();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1F1E1D" }}>
      <div className="text-center">
        <div
          className="text-white font-bold text-3xl w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: "#D97706" }}
        >
          N
        </div>
        <h1 className="text-white font-bold text-xl mb-2">Natureland</h1>
        <p className="text-gray-400 text-sm mb-6">Wellness Booking System</p>
        {isLoading ? (
          <div className="text-gray-400 text-sm animate-pulse">Connecting to server...</div>
        ) : error ? (
          <div>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={onLogin}
              className="text-white text-sm px-6 py-2 rounded font-medium"
              style={{ backgroundColor: "#D97706" }}
              data-testid="retry-login-button"
            >
              Retry
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
