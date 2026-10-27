-- ==============================================================================
-- PLUGPOINT: SUPABASE DATABASE INITIAL SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Deskripsi:
-- File migrasi ini menyiapkan seluruh tabel inti, batasan integritas, relasi,
-- helper function keamanan, trigger pencegah manipulasi hak akses, dan kebijakan RLS
-- untuk proyek direktori tempat kerja Plugpoint.
-- ==============================================================================

-- 1. EKSTENSI POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABEL PROFILES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  contributor_status TEXT NOT NULL DEFAULT 'unverified' 
    CHECK (contributor_status IN ('unverified', 'trusted')),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Profil publik pengguna dan status otorisasi';
COMMENT ON COLUMN public.profiles.contributor_status IS 'unverified (perlu moderasi) atau trusted (terbit langsung)';

-- ==============================================================================
-- 3. TABEL PLACES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  area TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  wifi_rating INTEGER CHECK (wifi_rating >= 1 AND wifi_rating <= 5),
  wifi_speed_mbps NUMERIC CHECK (wifi_speed_mbps > 0),
  outlet_level TEXT NOT NULL DEFAULT 'unknown' 
    CHECK (outlet_level IN ('few', 'many', 'unknown')),
  noise_level TEXT NOT NULL DEFAULT 'unknown' 
    CHECK (noise_level IN ('quiet', 'moderate', 'noisy', 'unknown')),
  opening_hours JSONB,
  quiet_hours TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.places IS 'Direktori tempat kerja dengan fasilitas Wi-Fi dan colokan';
COMMENT ON COLUMN public.places.opening_hours IS 'Jadwal operasional harian dalam format JSONB';

-- Index untuk performa pencarian dan filter direktori
CREATE INDEX IF NOT EXISTS idx_places_status ON public.places(status);
CREATE INDEX IF NOT EXISTS idx_places_area ON public.places(area);
CREATE INDEX IF NOT EXISTS idx_places_created_by ON public.places(created_by);

-- ==============================================================================
-- 4. TABEL REPORTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'wrong_location', 
    'permanently_closed', 
    'inaccurate_wifi', 
    'inaccurate_outlets', 
    'inappropriate_content', 
    'duplicate_place', 
    'other'
  )),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' 
    CHECK (status IN ('open', 'reviewing', 'resolved')),
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

COMMENT ON TABLE public.reports IS 'Laporan masalah tempat dari komunitas';
CREATE INDEX IF NOT EXISTS idx_reports_place_id ON public.reports(place_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- ==============================================================================
-- 5. TABEL PLACE_REVIEWS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.place_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wifi_rating INTEGER CHECK (wifi_rating >= 1 AND wifi_rating <= 5),
  outlet_rating INTEGER CHECK (outlet_rating >= 1 AND outlet_rating <= 5),
  noise_rating INTEGER CHECK (noise_rating >= 1 AND noise_rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_place_user_review UNIQUE (place_id, user_id)
);

COMMENT ON TABLE public.place_reviews IS 'Ulasan spesifik pengguna dengan 1 review aktif per tempat';
CREATE INDEX IF NOT EXISTS idx_place_reviews_place_id ON public.place_reviews(place_id);

-- ==============================================================================
-- 6. SECURITY HELPER FUNCTIONS (SECURITY DEFINER)
-- ==============================================================================
-- Helper untuk memeriksa apakah user saat ini adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Helper untuk memeriksa apakah user saat ini adalah kontributor tepercaya
CREATE OR REPLACE FUNCTION public.is_trusted_contributor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT contributor_status = 'trusted' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ==============================================================================
-- 7. TRIGGERS & AUTOMATION
-- ==============================================================================

-- Trigger A: Otomatis membuat baris di profiles ketika user baru mendaftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, contributor_status, is_admin)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    'unverified',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger B: Mencegah manipulasi is_admin & contributor_status oleh user biasa (Privilege Escalation Protection)
CREATE OR REPLACE FUNCTION public.handle_profile_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Jika bukan admin yang mengupdate, kembalikan nilai is_admin dan contributor_status ke nilai lama
  IF NOT public.is_admin() THEN
    NEW.is_admin := OLD.is_admin;
    NEW.contributor_status := OLD.contributor_status;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_roles ON public.profiles;
CREATE TRIGGER tr_protect_profile_roles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_protection();

-- Trigger C: Otomatis memperbarui kolom updated_at pada places
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_places_updated_at ON public.places;
CREATE TRIGGER tr_places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_reviews_updated_at ON public.place_reviews;
CREATE TRIGGER tr_reviews_updated_at
  BEFORE UPDATE ON public.place_reviews
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- A. Tabel profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- B. Tabel places
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Aturan Baca: Publik hanya bisa membaca status 'approved'. Pemilik bisa melihat miliknya, dan Admin bisa melihat semua.
CREATE POLICY "Places viewable by approved status or creator or admin"
  ON public.places FOR SELECT
  USING (
    status = 'approved' 
    OR auth.uid() = created_by 
    OR public.is_admin()
  );

-- Aturan Tambah: User biasa hanya boleh submit dengan status 'pending'. 
-- Kontributor tepercaya atau admin boleh langsung 'approved'.
CREATE POLICY "Users can insert places"
  ON public.places FOR INSERT
  WITH CHECK (
    auth.uid() = created_by 
    AND (
      (status = 'pending')
      OR (status = 'approved' AND (public.is_trusted_contributor() OR public.is_admin()))
    )
  );

-- Aturan Ubah:
-- 1. Admin bisa update seluruh data tempat
CREATE POLICY "Admins can update any place"
  ON public.places FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Pemilik hanya bisa update jika statusnya 'needs_revision' dan wajib kembali ke 'pending' saat disimpan
CREATE POLICY "Creators can update place for revision"
  ON public.places FOR UPDATE
  USING (auth.uid() = created_by AND status = 'needs_revision')
  WITH CHECK (auth.uid() = created_by AND status = 'pending');

-- Aturan Hapus: Hanya admin
CREATE POLICY "Admins can delete places"
  ON public.places FOR DELETE
  USING (public.is_admin());

-- C. Tabel reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Reporters can view own submitted reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Anyone can submit a report with open status"
  ON public.reports FOR INSERT
  WITH CHECK (status = 'open');

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- D. Tabel place_reviews
ALTER TABLE public.place_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON public.place_reviews FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create reviews"
  ON public.place_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own review"
  ON public.place_reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own review or admin can delete"
  ON public.place_reviews FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- 9. RPC FUNCTION UNTUK MODERASI TEMPAT (ADMIN ONLY)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.moderate_place(
  target_place_id UUID,
  new_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat melakukan moderasi';
  END IF;

  IF new_status NOT IN ('approved', 'rejected', 'needs_revision') THEN
    RAISE EXCEPTION 'Status tidak valid untuk moderasi: %', new_status;
  END IF;

  UPDATE public.places
  SET 
    status = new_status,
    rejection_reason = CASE WHEN new_status IN ('rejected', 'needs_revision') THEN reason ELSE NULL END,
    updated_at = now()
  WHERE id = target_place_id;

  RETURN jsonb_build_object(
    'success', true,
    'place_id', target_place_id,
    'status', new_status
  );
END;
$$;
