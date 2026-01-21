import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, ImageIcon, Clipboard, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DualImageUploadProps {
  cardId?: string;
  frontImageUrl: string | null;
  backImageUrl: string | null;
  onFrontImageChange: (url: string | null) => void;
  onBackImageChange: (url: string | null) => void;
  /** If true, uploads to storage immediately. If false, stores as data URL for form submission */
  immediateUpload?: boolean;
}

export function DualImageUpload({
  cardId,
  frontImageUrl,
  backImageUrl,
  onFrontImageChange,
  onBackImageChange,
  immediateUpload = false,
}: DualImageUploadProps) {
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const [showBack, setShowBack] = useState(!!backImageUrl);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Handle paste from clipboard
  const handlePaste = useCallback(async (e: ClipboardEvent, side: 'front' | 'back') => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          if (side === 'front') {
            await processFile(file, 'front');
          } else {
            await processFile(file, 'back');
          }
          break;
        }
      }
    }
  }, []);

  const processFile = async (file: File, side: 'front' | 'back') => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 5MB.',
        variant: 'destructive',
      });
      return;
    }

    const setUploading = side === 'front' ? setUploadingFront : setUploadingBack;
    const onImageChange = side === 'front' ? onFrontImageChange : onBackImageChange;

    setUploading(true);

    try {
      if (immediateUpload && cardId) {
        // Upload directly to storage
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const fileExt = file.name.split('.').pop() || 'jpg';
        const filePath = `${user.id}/${cardId}-${side}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('card-images')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('card-images')
          .getPublicUrl(filePath);

        onImageChange(publicUrl);

        toast({
          title: 'Image uploaded',
          description: `Card ${side} image has been updated.`,
        });
      } else {
        // Convert to data URL for later upload
        const reader = new FileReader();
        reader.onload = () => {
          onImageChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file, side);
    }
    // Reset input
    event.target.value = '';
  };

  const handleRemove = async (side: 'front' | 'back') => {
    const onImageChange = side === 'front' ? onFrontImageChange : onBackImageChange;
    const currentUrl = side === 'front' ? frontImageUrl : backImageUrl;

    if (immediateUpload && currentUrl && cardId) {
      try {
        const oldPath = currentUrl.split('/card-images/')[1];
        if (oldPath) {
          await supabase.storage.from('card-images').remove([oldPath]);
        }
      } catch (error) {
        console.warn('Failed to remove old image:', error);
      }
    }

    onImageChange(null);
    if (side === 'back') {
      setShowBack(false);
    }
  };

  const ImageUploadSlot = ({
    side,
    imageUrl,
    uploading,
    inputRef,
  }: {
    side: 'front' | 'back';
    imageUrl: string | null;
    uploading: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => {
    const [pasteActive, setPasteActive] = useState(false);

    // Focus handling for paste
    const handleFocus = () => setPasteActive(true);
    const handleBlur = () => setPasteActive(false);

    useEffect(() => {
      if (pasteActive) {
        const handler = (e: ClipboardEvent) => handlePaste(e, side);
        document.addEventListener('paste', handler);
        return () => document.removeEventListener('paste', handler);
      }
    }, [pasteActive, side]);

    return (
      <div className="flex-1">
        <div className="text-xs font-medium text-muted-foreground mb-2 text-center uppercase tracking-wide">
          {side === 'front' ? 'Front' : 'Back'}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e, side)}
          className="hidden"
        />

        {imageUrl ? (
          <div className="relative group">
            <div className="aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted border border-border">
              <img
                src={imageUrl}
                alt={`Card ${side}`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-3 h-3 mr-1" />
                Replace
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(side)}
                disabled={uploading}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={uploading}
            className={cn(
              'w-full aspect-[2/3] border-2 border-dashed rounded-lg',
              'flex flex-col items-center justify-center gap-2',
              'text-muted-foreground hover:text-foreground hover:border-primary/50',
              'transition-colors cursor-pointer bg-muted/30',
              pasteActive && 'border-primary/50 ring-2 ring-primary/20',
              uploading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {uploading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs text-center px-2">Click or paste</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                  <Clipboard className="w-3 h-3" />
                  <span>Ctrl+V</span>
                </div>
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <ImageUploadSlot
          side="front"
          imageUrl={frontImageUrl}
          uploading={uploadingFront}
          inputRef={frontInputRef}
        />
        
        {showBack ? (
          <ImageUploadSlot
            side="back"
            imageUrl={backImageUrl}
            uploading={uploadingBack}
            inputRef={backInputRef}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowBack(true)}
            className={cn(
              'flex-1 aspect-[2/3] border-2 border-dashed border-border/50 rounded-lg',
              'flex flex-col items-center justify-center gap-2',
              'text-muted-foreground/50 hover:text-muted-foreground hover:border-border',
              'transition-colors cursor-pointer'
            )}
          >
            <RotateCcw className="w-6 h-6" />
            <span className="text-xs">Add Back</span>
          </button>
        )}
      </div>
    </div>
  );
}
