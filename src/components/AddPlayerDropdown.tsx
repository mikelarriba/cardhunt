import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AddPlayerDropdownProps {
  onAddSingle: () => void;
}

export function AddPlayerDropdown({ onAddSingle }: AddPlayerDropdownProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Player
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-popover border-border">
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            onAddSingle();
          }}
          className="cursor-pointer"
        >
          <User className="w-4 h-4 mr-2" />
          Add Single Player
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            navigate('/bulk-create');
          }}
          className="cursor-pointer"
        >
          <Users className="w-4 h-4 mr-2" />
          Bulk Create Players
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
