import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Spinner from '../components/Spinner';

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="py-20" />);
    expect(container.firstChild).toHaveClass('py-20');
  });
});
