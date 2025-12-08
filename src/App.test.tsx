import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';
import '@testing-library/jest-dom'; // Этот импорт обязателен

test('renders Vite and React logos', () => {
    render(<App />);
    const viteLogoElement = screen.getByAltText('Vite logo')
    const reactLogoElement = screen.getByAltText('React logo')
    expect(viteLogoElement).toBeInTheDocument();
    expect(reactLogoElement).toBeInTheDocument();
});

test('renders "Vite + React" heading', () => {
    render(<App />);
    const headingElement = screen.getByText(/Vite \+ React/i)
    expect(headingElement).toBeInTheDocument()
})