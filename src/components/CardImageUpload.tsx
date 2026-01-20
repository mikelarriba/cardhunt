import { useState, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CardImageUploadProps {
  cardId: string;
  currentImageUrl: string | null;
  onImageUpdated: (url: string | null) => void;
}

export function CardImageUpload({ cardId, currentImageUrl, onImageUpdated }: CardImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${cardId}.${fileExt}`;

      // Delete existing image if present
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split('/card-images/')[1];
        if (oldPath) {
          await supabase.storage.from('card-images').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('card-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('card-images')
        .getPublicUrl(filePath);

      // Update card with new image URL
      const { error: updateError } = await supabase
        .from('cards')
        .update({ image_url: publicUrl })
        .eq('id', cardId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onImageUpdated(publicUrl);

      toast({
        title: 'Image uploaded',
        description: 'Card image has been updated.',
      });
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

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    setUploading(true);

    try {
      const oldPath = currentImageUrl.split('/card-images/')[1];
      if (oldPath) {
        await supabase.storage.from('card-images').remove([oldPath]);
      }

      const { error } = await supabase
        .from('cards')
        .update({ image_url: null })
        .eq('id', cardId);

      if (error) throw error;

      setPreviewUrl(null);
      onImageUpdated(null);

      toast({
        title: 'Image removed',
        description: 'Card image has been removed.',
      });
    } catch (error: any) {
      toast({
        title: 'Remove failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Card"
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="w-4 h-4 mr-1" />
              Replace
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemoveImage}
              disabled={uploading}
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'w-full h-64 border-2 border-dashed border-border rounded-lg',
            'flex flex-col items-center justify-center gap-3',
            'text-muted-foreground hover:text-foreground hover:border-primary/50',
            'transition-colors cursor-pointer',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
        >
          {uploading ? (
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-12 h-12" />
              <span className="text-sm">Click to upload card image</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
