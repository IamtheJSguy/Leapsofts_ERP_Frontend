import { Link } from '@mui/material';
import { splitTextWithUrls } from '@/utils/chatMessageUtils';

interface LinkifiedTextProps {
  text?: string | null;
  color?: string;
}

export const LinkifiedText = ({ text, color }: LinkifiedTextProps) => {
  if (!text) return null;

  return (
    <>
      {splitTextWithUrls(text).map((segment, index) =>
        segment.type === 'url' ? (
          <Link
            key={`${segment.href}-${index}`}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            underline="always"
            onClick={(e) => e.stopPropagation()}
            sx={{
              color: color || 'inherit',
              fontWeight: 600,
              wordBreak: 'break-all',
            }}
          >
            {segment.value}
          </Link>
        ) : (
          <span key={`text-${index}`}>{segment.value}</span>
        ),
      )}
    </>
  );
};
