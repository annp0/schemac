'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserSchema } from '@/lib/db/schema';
import { User } from 'next-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Database, Save, Trash, Plus, Table, File } from 'lucide-react';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { useSidebar } from './ui/sidebar';
import { useWindowSize } from 'usehooks-ts';

interface SchemaField {
  name: string;
  type: string;
  description?: string;
  exampleValues?: string[];
}

interface DocText {
  name: string;
  content: string;
}

export function SchemaEditor({
  initialSchema,
  user
}: {
  initialSchema: UserSchema;
  user: User;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schema, setSchema] = useState<UserSchema>(initialSchema);
  const [fields, setFields] = useState<SchemaField[]>(
    Array.isArray(initialSchema.content) ? initialSchema.content : []
  );
  const [documents, setDocuments] = useState<DocText[]>(
    Array.isArray(initialSchema.docText) ? initialSchema.docText : []
  );

  const handleUpdateSchema = async () => {
    if (!schema.name.trim()) {
      toast.error('Schema name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitize fields before sending to server
      const sanitizedFields = fields.map(field => ({
        name: field.name || '',
        type: field.type || 'string',
        description: field.description || '',
        exampleValues: Array.isArray(field.exampleValues) ? 
          field.exampleValues.filter(val => val !== '') : []
      }));

      // Sanitize documents
      const sanitizedDocs = documents.map(doc => ({
        name: doc.name || '',
        content: doc.content || ''
      }));

      // Send the request with ID in the body, not as a query parameter
      const response = await fetch('/api/schema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: schema.id, // Include ID in the body
          name: schema.name.trim(),
          description: schema.description?.trim() || '',
          content: sanitizedFields,
          docText: sanitizedDocs
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || 'Failed to update schema';
        } catch (e) {
          errorMessage = `Server error: ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      toast.success('Schema updated successfully');
      router.push('/schema/manage');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update schema');
      console.error('Schema update error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addField = () => {
    // Use explicit new object with default values
    setFields([...fields, { 
      name: '', 
      type: '', 
      description: '',
      exampleValues: []
    }]);
  };

  const updateField = (index: number, field: Partial<SchemaField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...field };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const addDocument = () => {
    setDocuments([...documents, { name: '', content: '' }]);
  };

  const updateDocument = (index: number, doc: Partial<DocText>) => {
    const newDocs = [...documents];
    newDocs[index] = { ...newDocs[index], ...doc };
    setDocuments(newDocs);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col min-w-0 h-full pb-6">
      {/* Header matching schema-manager style exactly */}
      <header className="flex bg-background py-1.5 items-center px-2 md:px-2 gap-2">
        <SidebarToggle />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleUpdateSchema}
              disabled={isSubmitting}
              variant="outline"
              className="md:px-2 md:h-fit"
            >
              <Save size={16} />
              <span className="ml-2 md:sr-only">Save</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent align="start">Save Changes</TooltipContent>
        </Tooltip>
        
        <h1 className="text-lg font-semibold mx-2 flex-1">Edit Database</h1>
      </header>

      {/* Content area with styling matching schema-manager */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto p-4 md:p-6 lg:p-8 max-w-screen-xl">
          <Card className="mb-6">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="size-5" />
                Database Details
              </CardTitle>
              <CardDescription>Basic information about your database</CardDescription>
            </CardHeader>
            <CardContent className="px-4 py-2 space-y-3">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input 
                  id="name" 
                  value={schema.name} 
                  onChange={(e) => setSchema({...schema, name: e.target.value})}
                  placeholder="Database name"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
                <Textarea 
                  id="description" 
                  value={schema.description || ''} 
                  onChange={(e) => setSchema({...schema, description: e.target.value})}
                  placeholder="Brief description of this database"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Table className="size-5" />
                  Database Columns
                </CardTitle>
                <CardDescription>Define the structure of your database</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={addField}>
                <Plus className="size-4 mr-1" />
                Add Column
              </Button>
            </CardHeader>
            <CardContent className="px-4 py-2">
              {fields.length === 0 ? (
                <div className="text-center py-3 text-sm text-muted-foreground">
                  No columns defined. Add columns to define your database structure.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  {/* Updated table header with example values */}
                  <div className="grid grid-cols-[1fr,120px,1fr,1fr,40px] gap-2 bg-muted/50 p-2 border-b text-sm font-medium">
                    <div>Column Name</div>
                    <div>Type</div>
                    <div>Description</div>
                    <div>Example Values</div>
                    <div></div> {/* Empty cell for the action button */}
                  </div>
                  
                  {/* Updated table rows with example values */}
                  <div className="divide-y">
                    {fields.map((field, index) => (
                      <div key={index} className="grid grid-cols-[1fr,120px,1fr,1fr,40px] gap-2 p-2 items-center">
                        <div>
                          <Input
                            className="w-full"
                            placeholder="Column name"
                            value={field.name}
                            onChange={(e) => updateField(index, { name: e.target.value })}
                          />
                        </div>
                        <div>
                          {/* Changed from select to input */}
                          <Input
                            className="w-full"
                            placeholder="Type"
                            value={field.type}
                            onChange={(e) => updateField(index, { type: e.target.value })}
                          />
                        </div>
                        <div>
                          <Input
                            placeholder="Description (optional)"
                            value={field.description || ''}
                            onChange={(e) => updateField(index, { description: e.target.value })}
                          />
                        </div>
                        <div>
                          {/* New example values field */}
                          <Input
                            placeholder="e.g. value1, value2"
                            value={field.exampleValues?.join(', ') || ''}
                            onChange={(e) => {
                              const examples = e.target.value
                                ? e.target.value.split(',').map(val => val.trim())
                                : [];
                              updateField(index, { exampleValues: examples });
                            }}
                          />
                        </div>
                        <div className="flex justify-center">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive size-8"
                            onClick={() => removeField(index)}
                          >
                            <Trash className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="size-5" />
                  Related Documents
                </CardTitle>
                <CardDescription>Add supporting documents for your database</CardDescription>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <label htmlFor="document-upload">
                    <div className="cursor-pointer">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        type="button" 
                        onClick={() => document.getElementById('document-upload')?.click()}
                        disabled={isSubmitting}
                      >
                        <Plus className="size-4 mr-1" />
                        Upload Document
                        {isSubmitting && <span className="ml-2 animate-spin">⏳</span>}
                      </Button>
                    </div>
                  </label>
                </TooltipTrigger>
                <TooltipContent>Upload a text file or PDF</TooltipContent>
              </Tooltip>
              <input
                id="document-upload"
                type="file"
                accept=".txt,.md,.csv,application/pdf,.pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  
                  setIsSubmitting(true);
                  
                  try {
                    // Handle different file types
                    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
                      // For PDFs - use the server-side API
                      const formData = new FormData();
                      formData.append('file', file);
                      
                      const response = await fetch('/api/pdf-extract', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      if (!response.ok) {
                        throw new Error('Failed to extract text from PDF');
                      }
                      
                      const data = await response.json();
                      
                      setDocuments([...documents, { 
                        name: file.name, 
                        content: data.text
                      }]);
                      
                      toast.success(`Extracted text from ${file.name}`);
                    } else {
                      // For text files - handle client-side as before
                      const text = await file.text();
                      setDocuments([...documents, { 
                        name: file.name, 
                        content: text 
                      }]);
                      toast.success(`Added ${file.name}`);
                    }
                    
                    // Reset the input
                    e.target.value = '';
                  } catch (error) {
                    toast.error('Could not process file');
                    console.error('File processing error:', error);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              />
            </CardHeader>
            
            <CardContent className="px-4 py-2">
              {documents.length === 0 ? (
                <div className="text-center py-3 text-sm text-muted-foreground">
                  No documents added. Upload documents to provide more context.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-[1fr,auto] gap-2 bg-muted/50 p-2 border-b text-sm font-medium">
                    <div>Text documents</div>
                    <div></div> {/* Empty cell for the action button */}
                  </div>
                  <div className="divide-y">
                    {documents.map((doc, index) => (
                      <div key={index} className="grid grid-cols-[1fr,auto] gap-2 p-2 items-center">
                        <div className="flex items-center">
                          <div className="bg-primary/10 size-8 rounded flex items-center justify-center mr-2">
                            <File className="size-4 text-primary" />
                          </div>
                          <div className="truncate">
                            <span className="text-sm">{doc.name}</span>
                            <div className="text-xs text-muted-foreground">
                              {doc.content ? `${(doc.content.length / 1024).toFixed(1)} KB` : '0 KB'}
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-destructive size-8"
                          onClick={() => removeDocument(index)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="px-4 py-2">
              <div className="text-xs text-muted-foreground">
                Documents help the AI understand the context of your database. Supported formats: .txt, .md, .csv, .pdf
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}