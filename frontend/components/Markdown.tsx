import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Raw HTML is disabled. React creates elements and the renderer filters unsafe URLs.
export function Markdown({ content }: { content: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={{
        a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
        // Private commit text must not trigger remote image tracking requests.
        img: ({ alt }) => <span>{alt}</span>,
      }}>{content}</ReactMarkdown>
    </div>
  );
}
