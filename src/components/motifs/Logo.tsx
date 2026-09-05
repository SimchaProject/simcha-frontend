interface LogoProps {
  size?: number
  className?: string
}

// A pomegranate crest - the fruit is the traditional symbol at a Jewish
// wedding for a blessing-filled, abundant marriage, and it's already the
// seed for the app's own favicon (three seeds in a red disc). This is the
// same idea with room to actually read as a pomegranate: a crown, a rounded
// body, a scatter of seeds, ringed like a wax seal.
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="18.25" fill="none" stroke="var(--simcha-gold)" strokeWidth="1.1" />
      <path
        d="M13.5,13.2 L15.3,8.6 L17,12.4 L20,7.4 L23,12.4 L24.7,8.6 L26.5,13.2 Z"
        fill="var(--simcha-red)"
      />
      <path
        d="M13,13.6 C10.6,16 9.6,19.2 9.6,22.4 C9.6,28.8 14.2,33.6 20,33.6 C25.8,33.6 30.4,28.8 30.4,22.4 C30.4,19.2 29.4,16 27,13.6 C24.3,15.1 15.7,15.1 13,13.6 Z"
        fill="var(--simcha-red)"
      />
      <circle cx="16.6" cy="21" r="1.35" fill="var(--simcha-paper)" />
      <circle cx="22.2" cy="19.4" r="1.35" fill="var(--simcha-paper)" />
      <circle cx="19.4" cy="25.4" r="1.35" fill="var(--simcha-paper)" />
      <circle cx="24.4" cy="24.6" r="1.35" fill="var(--simcha-paper)" />
      <circle cx="15.6" cy="26.6" r="1.1" fill="var(--simcha-paper)" />
    </svg>
  )
}
