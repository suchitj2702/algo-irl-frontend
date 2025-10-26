const COLORS = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
};

interface GoogleIconProps {
  className?: string;
}

export function GoogleIcon({ className = '' }: GoogleIconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M21.6 12.227c0-.637-.057-1.25-.163-1.84H12v3.48h5.382a4.598 4.598 0 0 1-1.994 3.016l-.019.126 2.897 2.244.2.02c1.84-1.695 2.898-4.193 2.898-7.046"
        fill={COLORS.blue}
      />
      <path
        d="M12 22c2.7 0 4.964-.897 6.618-2.425l-3.155-2.444c-.897.6-2.05.953-3.463.953-2.664 0-4.921-1.796-5.728-4.207l-.118.01-3.087 2.392-.04.113C3.665 19.786 7.522 22 12 22"
        fill={COLORS.green}
      />
      <path
        d="M6.272 13.877a5.997 5.997 0 0 1-.34-1.985c0-.69.125-1.362.34-1.983l-.006-.133-3.126-2.43-.102.049A9.953 9.953 0 0 0 2 11.892c0 1.62.388 3.151 1.064 4.517l3.208-2.532"
        fill={COLORS.yellow}
      />
      <path
        d="M12 4.956c1.876 0 3.142.809 3.863 1.485l2.819-2.732C16.955 1.496 14.7.5 12 .5 7.522.5 3.664 3.714 1.928 8.108l3.338 2.78C5.974 7.476 8.231 4.956 12 4.956"
        fill={COLORS.red}
      />
    </svg>
  );
}
