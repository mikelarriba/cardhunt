import { useState } from 'react';
import { Plus, X, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTags } from '@/hooks/useTags';
import { Tag } from '@/types/database';
import { cn } from '@/lib/utils';

interface TagManagerProps {
  playerId: string;
  playerTags: Tag[];
}

export function TagManager({ playerId, playerTags }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { tags, createTag, addPlayerTag, removePlayerTag } = useTags();

  const handleCreateAndAssign = async () => {
    if (!newTagName.trim()) return;
    
    const result = await createTag.mutateAsync(newTagName.trim());
    if (result) {
      addPlayerTag.mutate({ playerId, tagId: result.id });
    }
    setNewTagName('');
  };

  const handleToggleTag = (tag: Tag) => {
    const isAssigned = playerTags.some(pt => pt.id === tag.id);
    if (isAssigned) {
      removePlayerTag.mutate({ playerId, tagId: tag.id });
    } else {
      addPlayerTag.mutate({ playerId, tagId: tag.id });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {playerTags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 cursor-pointer"
          onClick={() => removePlayerTag.mutate({ playerId, tagId: tag.id })}
        >
          {tag.name}
          <X className="w-3 h-3 ml-1" />
        </Badge>
      ))}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
          >
            <TagIcon className="w-3 h-3 mr-1" />
            {playerTags.length === 0 ? 'Add to Collection' : '+'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3 bg-popover border-border" align="start">
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Collections
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {tags.map((tag) => {
                  const isAssigned = playerTags.some(pt => pt.id === tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant="secondary"
                      className={cn(
                        'cursor-pointer transition-colors',
                        isAssigned
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      )}
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag.name}
                    </Badge>
                  );
                })}
              </div>
            )}
            
            <div className="flex gap-2">
              <Input
                placeholder="New collection..."
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAssign()}
                className="h-8 text-sm bg-secondary/50"
              />
              <Button
                size="sm"
                className="h-8 px-2"
                onClick={handleCreateAndAssign}
                disabled={!newTagName.trim() || createTag.isPending}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
