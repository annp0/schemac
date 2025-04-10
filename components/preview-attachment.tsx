import type { Attachment } from 'ai';
import { LoaderIcon } from './icons';
import { FileIcon } from 'lucide-react';

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
}: {
  attachment: Attachment;
  isUploading?: boolean;
}) => {
  const { name, url } = attachment;

  const handleClick = () => {
    if (!isUploading && url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      data-testid="input-attachment-preview" 
      className="flex p-2 bg-muted rounded-md gap-2 items-center cursor-pointer hover:bg-muted/80 transition-colors"
      onClick={handleClick}
    >
      <div className="w-5 aspect-square rounded-md">        
        {isUploading ? (
          <div className="animate-spin text-zinc-500 size-5">
            <LoaderIcon />
          </div>
        ) : (
          <div className="text-zinc-500">
            <FileIcon width={20} height={20} />
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 max-w-20 truncate">{name}</div>
    </div>
  );
};