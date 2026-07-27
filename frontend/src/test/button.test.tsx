import { fireEvent, render, screen } from '@testing-library/react';
import { Link, MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button asChild', () => {
  it('renders a router link as the interactive element', () => {
    render(
      <MemoryRouter>
        <Button asChild>
          <Link to="/jobs">Browse jobs</Link>
        </Button>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Browse jobs' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Browse jobs' })).not.toBeInTheDocument();
  });

  it('prevents activation and removes disabled links from the tab order', () => {
    render(
      <Button asChild disabled>
        <a href="/jobs">Browse jobs</a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Browse jobs' });
    expect(link).toHaveAttribute('aria-disabled', 'true');
    expect(link).toHaveAttribute('tabindex', '-1');
    expect(fireEvent.click(link)).toBe(false);
  });
});
