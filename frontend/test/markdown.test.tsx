import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Markdown } from '../components/Markdown';

describe('untrusted Markdown', () => {
  it('blocks HTML, executable URLs, attribute injection and tracking images', () => {
    const html = renderToStaticMarkup(<Markdown content={'<img src=x onerror="alert(1)">\n\n[click](javascript:alert%281%29)\n\n[x](https://example.com/" onmouseover="alert%281%29)\n\n![tracking](https://tracker.test/pixel)'} />);
    expect(html).not.toMatch(/<img|<script|href="javascript:|<[^>]+\son(?:mouseover|error)=/i);
  });
  it('keeps useful formatting and safe links', () => {
    const html = renderToStaticMarkup(<Markdown content={'## Changes\n- **Fixed** `login`\n\n[Details](https://example.com)'} />);
    expect(html).toContain('<h2>Changes</h2>');
    expect(html).toContain('<strong>Fixed</strong>');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('noopener noreferrer');
  });
});
