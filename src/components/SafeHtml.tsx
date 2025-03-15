import React from 'react';
import DOMPurify from 'dompurify';
import { sanitizeHtml } from '../utils/security';

interface SafeHtmlProps {
  html: string;
  className?: string;
  allowedTags?: string[];
  allowedAttrs?: string[];
}

const SafeHtml: React.FC<SafeHtmlProps> = ({
  html,
  className,
  allowedTags,
  allowedAttrs
}) => {
  // Configuración personalizada de DOMPurify
  const config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttrs,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    ADD_ATTR: ['target'],
  };

  // Sanitizar HTML
  const sanitizedHtml = sanitizeHtml(html);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(sanitizedHtml, config)
      }}
    />
  );
};

export default SafeHtml;