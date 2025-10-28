import { type ReactNode } from "react";
import { AuthProviderButton } from "./AuthProviderButton";

interface AuthProviderListProps {
  title?: string;
  description?: string;
  inModal?: boolean;
  loading?: boolean;
  googleLabel?: string;
  onGoogleClick: () => void;
  footer?: ReactNode;
}

export function AuthProviderList({
  title = "Sign-in options",
  description = "Choose a provider to access your account securely.",
  inModal = false,
  loading,
  googleLabel,
  onGoogleClick,
  footer,
}: AuthProviderListProps) {
  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        <AuthProviderButton
          provider="google"
          loading={loading}
          label={googleLabel}
          onClick={onGoogleClick}
        />
      </div>

      <div className="space-y-1.5">
        <p
          className={`text-[11px] text-content-muted/70 ${
            inModal ? "text-center" : "text-left"
          }`}
        >
          Secure OAuth via Google • AlgoIRL never stores your password.
        </p>

        {footer}
      </div>
    </div>
  );
}
