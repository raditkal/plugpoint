-- ==============================================================================
-- PLUGPOINT: MIGRATION — Tambah sistem Favorites ke database yang sudah ada
-- Jalankan script ini di Supabase SQL Editor (sekali saja)
-- ==============================================================================

-- 1. Tambah kolom favorites_count ke tabel places (kalau belum ada)
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS favorites_count INTEGER NOT NULL DEFAULT 0;

-- 2. Buat tabel favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_place_favorite UNIQUE (user_id, place_id)
);

COMMENT ON TABLE public.favorites IS 'Favorit tempat per pengguna — sinkron antar perangkat';
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_place_id ON public.favorites(place_id);

-- 3. Trigger: auto update favorites_count saat row favorites INSERT/DELETE
CREATE OR REPLACE FUNCTION public.handle_favorites_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.places
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.place_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.places
    SET favorites_count = GREATEST(0, favorites_count - 1)
    WHERE id = OLD.place_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS tr_favorites_count ON public.favorites;
CREATE TRIGGER tr_favorites_count
  AFTER INSERT OR DELETE ON public.favorites
  FOR EACH ROW EXECUTE FUNCTION public.handle_favorites_count();

-- 4. RLS Policies untuk tabel favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can insert favorites" ON public.favorites;
CREATE POLICY "Authenticated users can insert favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Done!
SELECT 'Migration favorites berhasil dijalankan!' AS status;
