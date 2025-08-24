import { render, screen } from '@testing-library/react';
import Home from '../app/page';

test('renders home page content', () => {
  render(<Home />);
  expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
});
