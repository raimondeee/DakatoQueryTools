import { useCallback, useState } from 'react';
import { copyToClipboard } from '../utils/valuesFormatter';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  onCopied?: () => void;
}

export function CopyButton({
  text,
  label = 'Copy',
  className = 'btn btn-success btn-sm',
  onCopied,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text, onCopied]);

  return (
    <button type="button" className={className} onClick={handleCopy}>
      {copied ? 'Copied!' : label}
    </button>
  );
}
