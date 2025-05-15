'use client';

import { useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PlusIcon, Database, PencilIcon, TrashIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { UserSchema } from '@/lib/db/schema';
import { User } from 'next-auth';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useSidebar } from './ui/sidebar';
import { useWindowSize } from 'usehooks-ts';
import { useSchemaData } from '@/hooks/use-schema-data';

function PureSchemaManager({
  user
}: {
  user: User;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const { schemas, isLoading, mutate } = useSchemaData();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeleteSchema = async (id: string) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/schema?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete schema');
      }

      // Fix the type error by explicitly typing the parameter
      mutate(
        schemas.filter((schema: UserSchema) => schema.id !== id),
        false
      );

      setDeleteConfirmId(null);
      toast.success('Schema deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete schema');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-w-0 h-full pb-6">
      {/* Header with sidebar toggle, matching chat-header style */}
      <header className="flex bg-background py-1.5 items-center px-2 md:px-2 gap-2">
        <SidebarToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => router.push('/schema/new')}
              variant="outline"
              className="md:px-2 md:h-fit"
            >
              <PlusIcon size={16} />
              <span className="ml-2 md:sr-only">New Database</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent align="start">New Database</TooltipContent>
        </Tooltip>
        
        <h1 className="text-lg font-semibold mx-2 flex-1">Databases</h1>
      </header>

      {/* Content area with max-width matching chat */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto p-4 md:p-6 lg:p-8 max-w-screen-xl">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
            </div>
          ) : schemas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {schemas.map((schema: UserSchema) => (
                <Card key={schema.id} className="overflow-hidden bg-background shadow hover:shadow-md transition-shadow border">
                  <CardHeader className="px-4 pt-3 pb-0 flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Database className="size-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-base truncate max-w-[12rem]">{schema.name}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost" 
                        size="icon"
                        onClick={() => router.push(`/schema/${schema.id}`)}
                        className="size-8"
                      >
                        <PencilIcon className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(schema.id)}
                      >
                        <TrashIcon className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="px-4 py-2 text-sm text-muted-foreground">
                    <div className="line-clamp-2">
                      {schema.description || <span className="italic">No description</span>}
                    </div>
                    
                    <div className="h-px bg-border my-2"></div>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Columns</span>
                    </div>

                    {/* Display schema content preview */}
                    <SchemaContentPreview schema={schema} />
                  </CardContent>
            
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 border border-dashed rounded-lg mt-8">
              <Database className="size-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No databases yet</h3>
              <p className="text-muted-foreground mb-4 text-center max-w-md">
                Create your first database to help your AI assistant work with structured data
              </p>
              <Button onClick={() => router.push('/schema/new')} variant="outline">
                <PlusIcon className="mr-2 size-4" />
                Create Database
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this database? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteConfirmId(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDeleteSchema(deleteConfirmId)}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const SchemaManager = memo(PureSchemaManager, (prevProps, nextProps) => {
  return prevProps.user?.id === nextProps.user?.id;
});

function SchemaContentPreview({ schema }: { schema: UserSchema }) {
  // Handle case where content isn't available or isn't in expected format
  if (!schema.content || !Array.isArray(schema.content)) {
    return <span className="italic">No columns defined</span>;
  }

  // Get first few fields to display as preview (show up to 4)
  const fields = schema.content.slice(0, 4);
  const hasMoreFields = schema.content.length > 4;
  
  // Check for documents
  const hasDocuments = schema.docText && Array.isArray(schema.docText) && schema.docText.length > 0;
  
  return (
    <div className="mt-2 space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {fields.map((field: { name: string; type: string }, index: number) => (
          <div 
            key={index} 
            className="bg-primary/10 border border-primary/30 rounded px-1.5 py-0.5 text-xs"
          >
            <span className="font-medium truncate max-w-[80px]">{field.name}</span>
            <span className="mx-1 text-muted-foreground">|</span>
            <span className="text-muted-foreground truncate max-w-[60px]">{field.type}</span>
          </div>
        ))}
        {hasMoreFields && (
          <div className="flex items-center bg-muted/40 border border-border/60 rounded px-2 py-0.5 text-xs text-muted-foreground">
            +{schema.content.length - 4} more
          </div>
        )}
      </div>
      
      {/* Document preview section */}
      {hasDocuments && (
        <>
          <div className="h-px bg-border my-2"></div>
          <div className="text-xs text-muted-foreground mb-1">
            <span className="font-medium">Documents</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {schema.docText.slice(0, 4).map((doc: { name: string; content: string }, index: number) => (
              <div 
                key={index} 
                className="bg-primary/10 border border-primary/30 rounded px-1.5 py-0.5 text-xs truncate max-w-[80px]"
              >
                <span>{doc.name}</span>
              </div>
            ))}
            {schema.docText.length > 4 && (
              <div className="flex items-center bg-primary/10 border border-primary/30 rounded px-2 py-0.5 text-xs text-muted-foreground">
                +{schema.docText.length - 4} more
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}