import React from 'react';

const MarkdownRenderer: React.FC<{ content: string | undefined | null }> = ({ content }) => {
    if (!content) {
        return <p className="text-sm text-gray-400 dark:text-gray-500">No disponible.</p>;
    }

    const createMarkup = (line: string) => {
        const formatted = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
        return { __html: formatted };
    };

    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    let listItems: string[] = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc pl-6 my-2 space-y-1 text-gray-700 dark:text-gray-300">
                    {listItems.map((item, i) => (
                        <li key={i} dangerouslySetInnerHTML={createMarkup(item)} />
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.startsWith('# ')) {
            flushList();
            elements.push(<h3 key={index} className="text-xl font-bold mt-4 mb-2 text-gray-900 dark:text-white" dangerouslySetInnerHTML={createMarkup(line.substring(2))} />);
        } else if (line.startsWith('## ')) {
            flushList();
            elements.push(<h4 key={index} className="text-lg font-semibold mt-3 mb-1 text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={createMarkup(line.substring(3))} />);
        } else if (line.startsWith('### ')) {
            flushList();
            elements.push(<h5 key={index} className="text-base font-semibold mt-2 text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={createMarkup(line.substring(4))} />);
        } else if (line.startsWith('- ') || line.startsWith('* ')) {
            listItems.push(line.substring(2));
        } else if (line.trim() !== '') {
            flushList();
            elements.push(<p key={index} className="text-gray-700 dark:text-gray-300 leading-relaxed" dangerouslySetInnerHTML={createMarkup(line)} />);
        }
    });
    flushList();

    return <div className="text-sm">{elements}</div>;
};

export default MarkdownRenderer;