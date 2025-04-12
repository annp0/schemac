import { UserSchema } from '@/lib/db/schema';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Database,
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon
} from 'lucide-react';
import { memo } from 'react';

const PureSchemaItem = ({
  schema,
  isActive,
  isSelected,
  onDelete,
  onEdit,
  onSelect,
  setOpenMobile,
}: {
  schema: UserSchema;
  isActive: boolean;
  isSelected: boolean;
  onDelete: (schemaId: string) => void;
  onEdit: (schemaId: string) => void;
  onSelect: (schemaId: string, selected: boolean) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        isActive={isActive}
        onClick={(e) => {
          e.preventDefault(); // Prevent immediate navigation
          onSelect(schema.id, !isSelected);
        }}
      >
        <div className="flex items-center w-full">
          <div className={`size-5 mr-1 flex items-center justify-center ${isSelected ? 'text-primary' : 'text-transparent'}`}>
            {isSelected && <CheckIcon size={16} />}
          </div>
          <Database className="mr-2" size={16} />
          <span className="truncate">{schema.name}</span>
        </div>
      </SidebarMenuButton>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground mr-0.5"
            showOnHover={!isActive}
          >
            <MoreHorizontalIcon />
            <span className="sr-only">More</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="bottom" align="end">
          <DropdownMenuItem
            className="cursor-pointer focus:bg-muted"
            onSelect={() => onEdit(schema.id)}
          >
            <PencilIcon size={16} />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:bg-destructive/15 focus:text-destructive dark:text-red-500"
            onSelect={() => onDelete(schema.id)}
          >
            <TrashIcon size={16} />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
};

export const SchemaItem = memo(PureSchemaItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  return true;
});