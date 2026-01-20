import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGeneratePlayerImage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async (playerName: string, teams: string[]): Promise<string | null> => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-player-image', {
        body: { playerName, teams },
      });

      if (error) {
        console.error('Error generating image:', error);
        return null;
      }

      return data?.imageUrl || null;
    } catch (err) {
      console.error('Failed to generate image:', err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateImage, isGenerating };
}
