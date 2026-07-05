-- ============================================================================
-- SMART HOTEL BOOKING - SCRIPT KHOI TAO CO SO DU LIEU
-- Chay script nay trong Supabase SQL Editor
-- ============================================================================

-- 1. BANG PROFILES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150),
    phone_number VARCHAR(20),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    loyalty_tier VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- 2. TRIGGER TU DONG TAO PROFILE KHI DANG KY
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. BANG HOTELS
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Vietnam',
    description TEXT,
    star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
    phone VARCHAR(20),
    email VARCHAR(100),
    images TEXT[] DEFAULT '{}',
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);

-- 4. BANG ROOM_TYPES
CREATE TABLE IF NOT EXISTS room_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL,
    capacity_adults INTEGER NOT NULL DEFAULT 2,
    capacity_children INTEGER NOT NULL DEFAULT 0,
    area_sqm DECIMAL(6, 1),
    description TEXT,
    amenities TEXT[] DEFAULT '{}',
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_types_hotel ON room_types(hotel_id);

-- 5. BANG ROOMS
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_type_id UUID NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    room_number VARCHAR(10) NOT NULL,
    floor INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_type_id, room_number)
);

CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

-- 6. BANG BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    check_in_date TIMESTAMP NOT NULL,
    check_out_date TIMESTAMP NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    num_adults INTEGER NOT NULL DEFAULT 1,
    num_children INTEGER NOT NULL DEFAULT 0,
    special_requests TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (check_out_date > check_in_date)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Chong double booking o tang PostgreSQL.
-- tsrange(..., '[)') nghia la check_in duoc tinh, check_out khong tinh,
-- nen khach tra phong ngay 10 va khach khac nhan phong ngay 10 khong bi xem la trung.
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'booking_no_room_overlap'
    ) THEN
        ALTER TABLE bookings
            ADD CONSTRAINT booking_no_room_overlap
            EXCLUDE USING gist (
                room_id WITH =,
                tsrange(check_in_date, check_out_date, '[)') WITH &&
            )
            WHERE (status <> 'CANCELLED');
    END IF;
END $$;

-- 7. BANG REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    sentiment VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. BANG ROOM_SERVICE_REQUESTS
CREATE TABLE IF NOT EXISTS room_service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number VARCHAR(10) NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 9. SEED DATA
-- ============================================================================
INSERT INTO hotels (id, name, address, city, country, description, star_rating, phone, email, images)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Marriott Smart Resort Da Nang',
    '68 Vo Nguyen Giap, Phuoc My, Son Tra',
    'Da Nang',
    'Vietnam',
    'Khu nghi duong 5 sao sang trong toa lac ngay bai bien My Khe. Thiet ke hien dai ket hop net truyen thong Viet Nam.',
    5,
    '+84 236 3888 999',
    'info@marriott-danang.vn',
    ARRAY[
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'
    ]
) ON CONFLICT (id) DO NOTHING;

INSERT INTO room_types (hotel_id, name, base_price, capacity_adults, capacity_children, area_sqm, description, amenities, images)
VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Deluxe Ocean View', 2500000, 2, 1, 35.0,
     'Phong Deluxe rong rai voi ban cong nhin thang ra bien My Khe.',
     ARRAY['WiFi', 'Ban cong huong bien', 'Minibar', 'Ket sat'],
     ARRAY['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800']),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Executive Suite', 4800000, 2, 2, 65.0,
     'Suite hang thuong gia voi phong khach rieng biet va bon tam Jacuzzi.',
     ARRAY['WiFi', 'Bon tam Jacuzzi', 'Phong khach rieng', 'Bua sang mien phi'],
     ARRAY['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800']),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Standard Twin', 1200000, 2, 0, 25.0,
     'Phong tieu chuan voi 2 giuong don, tien nghi day du.',
     ARRAY['WiFi', 'Ket sat', 'Tu lanh mini'],
     ARRAY['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800']),
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Presidential Suite', 12000000, 4, 2, 120.0,
     'Biet thu tong thong voi 2 phong ngu, be boi rieng va quan gia phuc vu 24/7.',
     ARRAY['WiFi', 'Be boi rieng', 'Quan gia 24/7', 'Bon tam Jacuzzi', 'Bua sang tai phong'],
     ARRAY['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800']);

INSERT INTO rooms (room_type_id, room_number, floor, status)
SELECT rt.id, r.room_number, r.floor, 'AVAILABLE'
FROM room_types rt
CROSS JOIN (VALUES ('101', 1), ('102', 1), ('201', 2), ('202', 2), ('301', 3), ('302', 3)) AS r(room_number, floor)
WHERE rt.hotel_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND rt.name = 'Deluxe Ocean View'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (room_type_id, room_number, floor, status)
SELECT rt.id, r.room_number, r.floor, 'AVAILABLE'
FROM room_types rt
CROSS JOIN (VALUES ('601', 6), ('602', 6), ('701', 7)) AS r(room_number, floor)
WHERE rt.hotel_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND rt.name = 'Executive Suite'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (room_type_id, room_number, floor, status)
SELECT rt.id, r.room_number, r.floor, 'AVAILABLE'
FROM room_types rt
CROSS JOIN (VALUES ('103', 1), ('104', 1), ('203', 2), ('204', 2)) AS r(room_number, floor)
WHERE rt.hotel_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND rt.name = 'Standard Twin'
ON CONFLICT DO NOTHING;

INSERT INTO rooms (room_type_id, room_number, floor, status)
SELECT rt.id, r.room_number, r.floor, 'AVAILABLE'
FROM room_types rt
CROSS JOIN (VALUES ('801', 8)) AS r(room_number, floor)
WHERE rt.hotel_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND rt.name = 'Presidential Suite'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view hotels" ON hotels FOR SELECT USING (true);

ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view room types" ON room_types FOR SELECT USING (true);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rooms" ON rooms FOR SELECT USING (true);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
