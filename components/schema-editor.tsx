'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { UserSchema } from '@/lib/db/schema';
import { User } from 'next-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Database, Save, Trash, Plus, Table, File, X, Code } from 'lucide-react';
import { SidebarToggle } from '@/components/sidebar-toggle';
import { useSidebar } from './ui/sidebar';
import { useWindowSize } from 'usehooks-ts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

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
  user,
  isNew = false
}: {
  initialSchema: UserSchema;
  user: User;
  isNew?: boolean;
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
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [jsonEditorContent, setJsonEditorContent] = useState<string>(
    JSON.stringify(fields, null, 2)
  );
  const [editMode, setEditMode] = useState<'form' | 'json'>('form');

  const handleCancel = useCallback(() => {
    router.push('/schema/manage');
  }, [router]);

  const updateJsonFromForm = useCallback(() => {
    setJsonEditorContent(JSON.stringify(fields, null, 2));
    setJsonError(null);
  }, [fields]);

  const updateFormFromJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonEditorContent);

      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of column definitions');
      }

      setFields(parsed.map(field => ({
        name: field.name || '',
        type: field.type || '',
        description: field.description || '',
        exampleValues: Array.isArray(field.exampleValues) ? field.exampleValues : []
      })));

      setJsonError(null);
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : 'Invalid JSON format');
      return false;
    }
    return true;
  }, [jsonEditorContent]);

  const handleTabChange = (value: string) => {
    if (value === 'json' && editMode === 'form') {
      updateJsonFromForm();
    } else if (value === 'form' && editMode === 'json') {
      if (!updateFormFromJson()) {
        toast.error('Cannot switch to form view: Invalid JSON format');
        return;
      }
    }
    setEditMode(value as 'form' | 'json');
  };

  const handleUpdateSchema = async () => {
    if (editMode === 'json') {
      if (!updateFormFromJson()) {
        toast.error('Invalid JSON format. Please fix before saving.');
        return;
      }
    }

    if (!schema.name.trim()) {
      toast.error('Schema name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const sanitizedFields = fields.map(field => ({
        name: field.name || '',
        type: field.type || 'string',
        description: field.description || '',
        exampleValues: Array.isArray(field.exampleValues) ? 
          field.exampleValues.filter(val => val !== '') : []
      }));

      const sanitizedDocs = documents.map(doc => ({
        name: doc.name || '',
        content: doc.content || ''
      }));

      const requestData = {
        name: schema.name.trim(),
        description: schema.description?.trim() || '',
        content: sanitizedFields,
        docText: sanitizedDocs
      };

      if (!isNew) {
        Object.assign(requestData, { id: schema.id });
      }

      const endpoint = '/api/schema';
      const method = isNew ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || `Failed to ${isNew ? 'create' : 'update'} schema`;
        } catch (e) {
          errorMessage = `Server error: ${errorText.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      toast.success(`Schema ${isNew ? 'created' : 'updated'} successfully`);
      router.push('/schema/manage');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${isNew ? 'create' : 'update'} schema`);
      console.error('Schema operation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addField = () => {
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
      <header className="flex bg-background py-1.5 items-center px-2 md:px-2 gap-2">
        <SidebarToggle />
        
        <h1 className="text-lg font-semibold mx-2 flex-1">
          {isNew ? 'Create Database' : 'Edit Database'}
        </h1>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto p-4 md:p-6 lg:p-8 max-w-screen-xl">
          {/* Database Details Card - Always visible */}
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

          {/* Database Columns Card - With Tabs */}
          <Tabs value={editMode} onValueChange={handleTabChange} className="mb-6">
            <Card>
              <CardHeader className="px-4 py-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Table className="size-5" />
                    Columns
                  </CardTitle>
                  <CardDescription>Define the structure of your database</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <TabsList>
                    <TabsTrigger value="form" className="flex items-center gap-1">
                      <Table className="size-4" />
                      Form View
                    </TabsTrigger>
                    <TabsTrigger value="json" className="flex items-center gap-1">
                      <Code className="size-4" />
                      JSON View
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              
              <CardContent className="px-4 py-2">
                <TabsContent value="form" className="mt-0">
                  <div className="border rounded-md overflow-hidden">
                    {/* Fixed header - always visible */}
                    <div className="grid grid-cols-[1fr,1fr,1fr,1fr,40px] gap-2 bg-muted/50 p-2 border-b text-sm font-medium sticky top-0 z-10">
                      <div>Column Name</div>
                      <div>Type</div>
                      <div>Description</div>
                      <div>Example Values</div>
                      <div></div>
                    </div>
                    
                    {/* Scrollable content area with max height */}
                    <div className="divide-y max-h-[400px] overflow-y-auto">
                      {fields.length === 0 ? (
                        <div className="grid grid-cols-[1fr] p-2 text-center text-sm text-muted-foreground">
                          No columns defined. Add columns using the button below.
                        </div>
                      ) : (
                        fields.map((field, index) => (
                          <div key={index} className="grid grid-cols-[1fr,1fr,1fr,1fr,40px] gap-2 p-2 items-center">
                            {/* Existing field input elements */}
                            <div>
                              <Input
                                className="w-full"
                                placeholder="Column name"
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                              />
                            </div>
                            <div>
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
                        ))
                      )}
                      
                      {/* Add Column button - always visible as the last row */}
                      <div className="grid grid-cols-[1fr] p-2 border-t">
                        <Button 
                          variant="ghost" 
                          onClick={addField}
                          className="w-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="size-4 mr-1" />
                          Add Column
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="json" className="mt-0">
                  <Textarea
                    value={jsonEditorContent}
                    onChange={(e) => setJsonEditorContent(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  {jsonError && (
                    <div className="text-destructive text-sm mt-2">{jsonError}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    JSON should be an array of column definitions with name, type, description, and exampleValues.
                  </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>

          {/* Documents Card - Always visible */}
          <Card className="mb-10 md:mb-8">
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
                      >
                        <Plus className="size-4 mr-1" />
                        Upload Document
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
                    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
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
                      const text = await file.text();
                      setDocuments([...documents, { 
                        name: file.name, 
                        content: text 
                      }]);
                      toast.success(`Added ${file.name}`);
                    }
                    
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
                    <div></div>
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
                Related Documents (Data Dictionaries, Documentation, etc.) help the AI understand the context of your database. Supported formats: .txt, .md, .csv, .pdf
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <footer className="px-4 flex justify-end gap-2 z-10">
        <Button
          onClick={handleCancel}
          disabled={isSubmitting}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpdateSchema}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : isNew ? 'Create Database' : 'Save Changes'}
        </Button>
      </footer>
    </div>
  );
}