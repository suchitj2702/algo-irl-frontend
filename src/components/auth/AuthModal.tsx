import { useCallback, useEffect, useState } from "react";
import { X, LogIn } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthModal({ isOpen, onClose, message }: AuthModalProps) {
  const { signInWithGoogle, clearError, error, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsProcessing(false);
      clearError();
    }
  }, [isOpen, clearError]);

  const handleGoogleSignIn = useCallback(async () => {
    setIsProcessing(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      // Error message surfaced through AuthContext.error
    } finally {
      setIsProcessing(false);
    }
  }, [signInWithGoogle, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-panel-500 shadow-xl p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-content-muted hover:text-content transition-colors"
          aria-label="Close sign-in dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-4">
          <LogIn className="w-10 h-10 mx-auto text-mint-600" />
          <div>
            <h2 className="text-xl font-semibold text-content font-playfair">Sign in to continue</h2>
            <p className="text-sm text-content-muted dark:text-content-subtle mt-1">
              {message || "Access premium features by signing in with your account."}
            </p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || isProcessing}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-button-600 text-button-foreground font-medium hover:bg-button-700 transition-colors disabled:opacity-60"
          >
            {loading || isProcessing ? "Signing in…" : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
}
