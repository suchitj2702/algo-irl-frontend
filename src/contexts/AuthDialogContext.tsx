import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AuthModal, type AuthModalProps } from "../components/auth/AuthModal";

type AuthIntent = "default" | "navbar" | "premium-gate" | "unlock-comprehensive" | string;

interface AuthDialogOptions {
  intent?: AuthIntent;
  message?: string;
  postAuthAction?: AuthModalProps["postAuthAction"];
  onSuccess?: () => void;
}

interface ResolvedAuthDialogOptions {
  intent: AuthIntent;
  message: string;
  postAuthAction: AuthModalProps["postAuthAction"];
  onSuccess?: () => void;
}

export interface AuthDialogContextValue {
  openAuthDialog: (options?: AuthDialogOptions) => void;
  closeAuthDialog: () => void;
  suppressNavSignInButton: () => () => void;
  navSignInHidden: boolean;
}

export const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined);

const INTENT_DEFAULTS: Record<string, Omit<ResolvedAuthDialogOptions, "intent">> = {
  default: {
    message: "Sign in to save your progress",
    postAuthAction: null,
  },
  navbar: {
    message: "Sign in to save your progress",
    postAuthAction: null,
  },
  "premium-gate": {
    message: "Sign in to access the full problem dataset",
    postAuthAction: "select-full-dataset",
  },
  "unlock-comprehensive": {
    message: "Sign in to unlock premium features",
    postAuthAction: "unlock-comprehensive",
  },
};

function resolveOptions(options: AuthDialogOptions | undefined): ResolvedAuthDialogOptions {
  const intent = options?.intent ?? "default";
  const defaults = INTENT_DEFAULTS[intent] ?? INTENT_DEFAULTS.default;

  return {
    intent,
    message: options?.message ?? defaults.message,
    postAuthAction: options?.postAuthAction ?? defaults.postAuthAction ?? null,
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
        message={dialogState.options?.message}
        postAuthAction={dialogState.options?.postAuthAction ?? null}
        onAuthSuccess={dialogState.options?.onSuccess}
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
