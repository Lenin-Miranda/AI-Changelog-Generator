// Tiny Markdown renderer — enough for changelog output (headings, lists,
// bold, inline code, links). Avoids pulling in a full markdown dependency.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
    );
}

function toHtml(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      out.push('</ul>');
      inList = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{3}\s/.test(line)) {
      closeList();
      out.push(`<h3>${inline(line.replace(/^#{3}\s/, ''))}</h3>`);
    } else if (/^#{2}\s/.test(line)) {
      closeList();
      out.push(`<h2>${inline(line.replace(/^#{2}\s/, ''))}</h2>`);
    } else if (/^#\s/.test(line)) {
      closeList();
      out.push(`<h1>${inline(line.replace(/^#\s/, ''))}</h1>`);
    } else if (/^[-*]\s/.test(line)) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      out.push(`<li>${inline(line.replace(/^[-*]\s/, ''))}</li>`);
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

export function Markdown({ content }: { content: string }) {
  return (
    <div
      className="markdown"
      dangerouslySetInnerHTML={{ __html: toHtml(content) }}
    />
  );
}
