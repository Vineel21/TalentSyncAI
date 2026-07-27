import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · TalentSync AI`;
    return () => {
      document.title = 'TalentSync AI';
    };
  }, [title]);
}
