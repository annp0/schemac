'use client';

interface CodeBlockProps {
  node: any;
  className: string;
  children: any;
  isPre?: boolean;
}

export function CodeBlock({
  node,
  className,
  children,
  isPre,
  ...props
}: CodeBlockProps) {
  if (isPre) {
    return (
      <div className="not-prose flex flex-col">
        <pre
          {...props}
          className={`text-sm dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-700 rounded-xl dark:text-zinc-50 text-zinc-900 mx-4 max-w-[calc(100vw-2rem)] overflow-x-auto`}
        >
          <code className="whitespace-pre-wrap break-all">{children}</code>
        </pre>
      </div>
    );
  } else {
    return (
      <code
        className={`${className} text-sm bg-zinc-100 dark:bg-zinc-800 py-0.5 px-1 rounded-md break-all`}
        {...props}
      >
        {children}
      </code>
    );
  }
}
