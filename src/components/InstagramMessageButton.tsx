type Props = { username: string };

export default function InstagramMessageButton({ username }: Props) {
  if (!username) return null;

  return (
    <a
      className="instagram-message-button"
      href={`https://ig.me/m/${encodeURIComponent(username)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Message @${username} on Instagram`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.7" cy="6.3" r="0.8" fill="currentColor" stroke="none" />
      </svg>
      Message us on Instagram
    </a>
  );
}
