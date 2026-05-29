import { cn } from "@/lib/utils";

interface MessageContentProps {
  content: string;
  isUser?: boolean;
}

export function MessageContent({ content, isUser = false }: MessageContentProps) {
  const renderContent = () => {
    const parts: React.ReactNode[] = [];
    let remaining = content;
    let key = 0;

    // Process tables first
    const tableRegex = /\|(.+)\|[\r\n]+\|[-:| ]+\|[\r\n]+((?:\|.+\|[\r\n]*)+)/g;
    let lastIndex = 0;
    let match;

    while ((match = tableRegex.exec(content)) !== null) {
      // Add text before the table
      if (match.index > lastIndex) {
        const textBefore = content.slice(lastIndex, match.index);
        parts.push(
          <span key={key++} dangerouslySetInnerHTML={{ __html: formatText(textBefore) }} />
        );
      }

      // Parse and render table
      const headerRow = match[1];
      const bodyRows = match[2].trim().split("\n");

      const headers = headerRow.split("|").map((h) => h.trim()).filter(Boolean);
      const rows = bodyRows.map((row) =>
        row.split("|").map((cell) => cell.trim()).filter(Boolean)
      );

      parts.push(
        <div key={key++} className="my-3 overflow-x-auto">
          <table className={cn(
            "w-full text-xs border-collapse",
            isUser ? "text-white" : "text-slate-700"
          )}>
            <thead>
              <tr className={cn(
                "border-b",
                isUser ? "border-white/30" : "border-slate-200"
              )}>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-3 py-2 text-left font-semibold",
                      isUser ? "text-white" : "text-geeko-navy"
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    "border-b last:border-0",
                    isUser ? "border-white/20" : "border-slate-100"
                  )}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className={cn(
                        "px-3 py-2",
                        cellIndex === 0 ? "font-medium" : "",
                        // Right-align numbers
                        /^\$?[\d,]+\.?\d*$/.test(cell.replace(/[,$]/g, "")) ? "text-right" : ""
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last table
    if (lastIndex < content.length) {
      const textAfter = content.slice(lastIndex);
      parts.push(
        <span key={key++} dangerouslySetInnerHTML={{ __html: formatText(textAfter) }} />
      );
    }

    // If no tables found, just format the text
    if (parts.length === 0) {
      return <span dangerouslySetInnerHTML={{ __html: formatText(content) }} />;
    }

    return <>{parts}</>;
  };

  return (
    <div className={cn("prose prose-sm max-w-none", isUser && "prose-invert")}>
      {renderContent()}
    </div>
  );
}

function formatText(text: string): string {
  return text
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    // Code
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-geeko-teal px-1 py-0.5 rounded text-xs">$1</code>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Line breaks
    .replace(/\n/g, "<br />");
}
