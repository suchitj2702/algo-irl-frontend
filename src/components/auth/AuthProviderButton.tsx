import { type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { GoogleIcon } from "../icons/GoogleIcon";

type ProviderType = "google";

interface AuthProviderButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  provider: ProviderType;
  label?: string;
  loading?: boolean;
}

const PROVIDER_CONFIG: Record<
  ProviderType,
  {
    label: string;
    Icon: typeof GoogleIcon;
  }
> = {
  google: {
    label: "Continue with Google",
    Icon: GoogleIcon,
  },
};

export function AuthProviderButton({
  provider,
  label,
  loading = false,
  className,
  ...props
}: AuthProviderButtonProps) {
  const config = PROVIDER_CONFIG[provider];
  const Icon = config.Icon;

  return (
    <button
      type="button"
      className={cn(
        "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-content font-medium border border-outline-subtle hover:bg-cream-100 dark:bg-panel-50 dark:hover:bg-panel-100 transition-all duration-150 disabled:opacity-60 disabled:pointer-events-none shadow-[0_2px_10px_rgba(15,23,42,0.06)]",
        className,
      )}
      disabled={props.disabled ?? loading}
      {...props}
    >
      <Icon className="h-5 w-5" />
      <span>{loading ? "Signing in…" : label || config.label}</span>
    </button>
  );
}
