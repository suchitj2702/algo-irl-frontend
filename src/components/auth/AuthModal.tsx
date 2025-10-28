import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { AuthProviderList } from "./AuthProviderList";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  primaryButtonLabel?: string;
  onSuccess?: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  title,
  description,
  primaryButtonLabel = "Continue with Google",
  onSuccess,
}: AuthModalProps) {
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
      onSuccess?.();
      onClose();
    } catch {
      // Error message surfaced through AuthContext.error
    } finally {
      setIsProcessing(false);
    }
  }, [signInWithGoogle, onClose, onSuccess]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white/80 dark:bg-surface-elevated/80 backdrop-blur-2xl border border-outline-subtle/70 shadow-[0_30px_70px_rgba(15,23,42,0.18)] p-6 md:p-8">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-content-muted hover:text-content transition-colors"
          aria-label="Close sign-in dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-6">
          <h2 className="text-xl text-content text-center">
            <span className="font-normal">Log in to</span> <span className="font-semibold font-playfair">AlgoIRL</span>
          </h2>

          <AuthProviderList
            inModal
            loading={loading || isProcessing}
            googleLabel={primaryButtonLabel}
            onGoogleClick={handleGoogleSignIn}
            footer={error ? <p className="text-sm text-red-500 text-center">{error}</p> : undefined}
          />
        </div>
      </div>
    </div>
  );
}
