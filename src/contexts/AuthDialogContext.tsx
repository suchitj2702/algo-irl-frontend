import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AuthModal } from "../components/auth/AuthModal";

type AuthIntent = "navbar" | "premium-gate" | string;

interface AuthDialogOptions {
  intent?: AuthIntent;
  title?: string;
  description?: string;
  ctaLabel?: string;
  onSuccess?: () => void;
}

interface ResolvedAuthDialogOptions {
  intent: AuthIntent;
  title: string;
  description: string;
  ctaLabel: string;
  onSuccess?: () => void;
}

interface AuthDialogContextValue {
  openAuthDialog: (options?: AuthDialogOptions) => void;
  closeAuthDialog: () => void;
  suppressNavSignInButton: () => () => void;
  navSignInHidden: boolean;
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined);

const INTENT_DEFAULTS: Record<string, Omit<ResolvedAuthDialogOptions, "intent">> = {
  default: {
    title: "Sign in to access your study plans",
    description: "Sync your personalized plans, solution drafts, and premium guidance across devices.",
    ctaLabel: "Continue with Google",
  },
  navbar: {
    title: "Sign in to access your study plans",
    description: "Create study plans, save solutions, and keep your progress synced wherever you prep.",
    ctaLabel: "Continue with Google",
  },
  "premium-gate": {
    title: "Sign in to unlock this feature",
    description: "Sync study plans, bookmarks, and saved code securely in the cloud.",
    ctaLabel: "Continue with Google",
  },
};

function resolveOptions(options: AuthDialogOptions | undefined): ResolvedAuthDialogOptions {
  const intent = options?.intent ?? "default";
  const defaults = INTENT_DEFAULTS[intent] ?? INTENT_DEFAULTS.default;

  return {
    intent,
    title: options?.title ?? defaults.title,
    description: options?.description ?? defaults.description,
    ctaLabel: options?.ctaLabel ?? defaults.ctaLabel,
    onSuccess: options?.onSuccess,
  };
}

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    options: ResolvedAuthDialogOptions | null;
  }>({
    isOpen: false,
    options: null,
  });

  const [navSuppressionCount, setNavSuppressionCount] = useState(0);

  const openAuthDialog = useCallback((options?: AuthDialogOptions) => {
    setDialogState({ isOpen: true, options: resolveOptions(options) });
  }, []);

  const closeAuthDialog = useCallback(() => {
    setDialogState({ isOpen: false, options: null });
  }, []);

  const suppressNavSignInButton = useCallback(() => {
    setNavSuppressionCount((count) => count + 1);
    let released = false;

    return () => {
      if (released) {
        return;
      }

      released = true;
      setNavSuppressionCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const contextValue = useMemo<AuthDialogContextValue>(
    () => ({
      openAuthDialog,
      closeAuthDialog,
      suppressNavSignInButton,
      navSignInHidden: navSuppressionCount > 0,
    }),
    [openAuthDialog, closeAuthDialog, suppressNavSignInButton, navSuppressionCount],
  );

  return (
    <AuthDialogContext.Provider value={contextValue}>
      {children}
      <AuthModal
        isOpen={dialogState.isOpen}
        onClose={closeAuthDialog}
        title={dialogState.options?.title}
        description={dialogState.options?.description}
        primaryButtonLabel={dialogState.options?.ctaLabel}
        onSuccess={dialogState.options?.onSuccess}
      />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog(): AuthDialogContextValue {
  const context = useContext(AuthDialogContext);

  if (!context) {
    throw new Error("useAuthDialog must be used within an AuthDialogProvider");
  }

  return context;
}
