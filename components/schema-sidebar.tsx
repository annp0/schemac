'use client';

import { useParams, useRouter } from 'next/navigation';
import type { User } from 'next-auth';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  FileIcon,
  PlusIcon,
  TrashIcon
} from '@/components/icons';
import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import type { UserSchema } from '@/lib/db/schema';
import { SettingsIcon, Database } from 'lucide-react';
import { SchemaItem } from './schema-item';
import { useSchemaSelection } from './schema-provider';
import useSWR from 'swr';
import { fetcher } from '@/lib/utils';

export function SidebarSchemas({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { id } = useParams();
  const { setOpenMobile } = useSidebar();
  const { toggleSchemaSelection, isSchemaSelected } = useSchemaSelection();
  
  // Replace useEffect+fetch with useSWR
  const { 
    data: schemas = [], 
    isLoading,
    mutate 
  } = useSWR<UserSchema[]>(
    user ? '/api/schema' : null,
    fetcher,
    {
      fallbackData: [],
      revalidateOnMount: true
    }
  );

  const handleDelete = async (schemaId: string) => {
    const deletePromise = fetch(`/api/schema?id=${schemaId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting schema...',
      success: () => {
        // Use mutate to update the cache instead of setState
        mutate(
          schemas.filter((schema) => schema.id !== schemaId),
          false // Set to false to avoid revalidation after mutation
        );
        return 'Schema deleted successfully';
      },
      error: 'Failed to delete schema',
    });
  };

  const handleEdit = (schemaId: string) => {
    setOpenMobile(false);
    router.push(`/schema/${schemaId}`);
  };

  if (!user) {
    // Unchanged code
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Login to create and manage schemas
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  if (isLoading) {
    // Unchanged loading state
    return (
      <SidebarGroup>
        <div className="px-2 text-sm py-1">Databases</div>
        <SidebarGroupContent>
          <div className="flex flex-col">
            {[40, 52, 36].map((item, idx) => (
              <div
                key={idx}
                className="rounded-md h-8 flex gap-2 px-2 items-center"
              >
                <div
                  className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
                  style={
                    {
                      '--skeleton-width': `${item}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
            ))}
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between">
        <div className="px-2 text-sm py-1">Databases</div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => {
                setOpenMobile(false);
                router.push('/schema/manage');
              }}
            >
              <SettingsIcon size={4} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Manage Databases</TooltipContent>
        </Tooltip>
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          {schemas.length > 0 ? (
            <div className="flex flex-col">
              {schemas.map((schema) => (
                <SchemaItem
                  key={schema.id}
                  schema={schema}
                  isActive={schema.id === id}
                  isSelected={isSchemaSelected(schema.id)}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onSelect={toggleSchemaSelection}
                  setOpenMobile={setOpenMobile}
                />
              ))}
            </div>
          ) : (
            <div className="px-2 text-zinc-500 w-full flex flex-row text-sm gap-2">
              Create a schema to get started
            </div>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}