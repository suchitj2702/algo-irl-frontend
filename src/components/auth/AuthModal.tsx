import { useCallback, useEffect, useState } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
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

        <div className="text-center space-y-6">
          <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-button-600 via-primary to-mint-500 shadow-[0_12px_24px_rgba(79,70,229,0.25)]">
            <div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-white/5" />
            <ShieldCheck className="relative h-7 w-7 text-white" />
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-content font-playfair">
                {title || "Sign in to access your study plans"}
              </h2>
              <p className="text-sm text-content-muted dark:text-content-subtle">
                {description ||
                  "Sync your personalized study plans, saved solutions, and premium guidance across every device."}
              </p>
            </div>
            <ul className="space-y-2 text-left text-sm text-content-muted dark:text-content-subtle">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-mint-500" />
                <span>Resume study plans right where you left off.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-mint-500" />
                <span>Keep premium problem bookmarks and status synced automatically.</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-[18px] w-[18px] flex-shrink-0 text-mint-500" />
                <span>Store solution drafts safely with cloud backups.</span>
              </li>
            </ul>
          </div>

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
