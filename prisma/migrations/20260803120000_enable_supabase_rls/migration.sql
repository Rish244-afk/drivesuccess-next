-- ==============================================================================
-- PHASE 2 & PHASE 3: ENABLE ROW LEVEL SECURITY (RLS) & DEFINE POLICIES
-- ==============================================================================

-- 1. Enable RLS on all user-facing tables
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "instructors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "otp_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "packages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "availabilities" ENABLE ROW LEVEL SECURITY;

-- 2. Define Policies for "students" (Profiles)
CREATE POLICY "Users can view their own profile" 
ON "students" 
FOR SELECT 
USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" 
ON "students" 
FOR UPDATE 
USING (auth.uid()::text = id);

-- 3. Define Policies for "notifications"
CREATE POLICY "Users can view their own notifications" 
ON "notifications" 
FOR SELECT 
USING (auth.uid()::text = "studentId");

CREATE POLICY "Users can update their own notifications (mark as read)" 
ON "notifications" 
FOR UPDATE 
USING (auth.uid()::text = "studentId");

-- 4. Define Policies for "bookings"
CREATE POLICY "Users can view their own bookings" 
ON "bookings" 
FOR SELECT 
USING (auth.uid()::text = "studentId");

-- 5. Define Policies for "sessions"
CREATE POLICY "Users can view their own sessions" 
ON "sessions" 
FOR SELECT 
USING (auth.uid()::text = "studentId");

-- 6. Define Policies for Public/Read-Only Resources
CREATE POLICY "Public read access for vehicles" 
ON "vehicles" 
FOR SELECT 
USING (status = 'AVAILABLE');

CREATE POLICY "Public read access for packages" 
ON "packages" 
FOR SELECT 
USING (true);

CREATE POLICY "Public read access for instructors" 
ON "instructors" 
FOR SELECT 
USING (true);

CREATE POLICY "Public read access for availabilities" 
ON "availabilities" 
FOR SELECT 
USING (true);

-- 7. Define Admin Override Policies (Bypass RLS for Admins)
-- Note: In Supabase, the Service Role key bypasses RLS by default.
-- For authenticated users with an ADMIN role claim in their JWT:
CREATE POLICY "Admins have full access to students" ON "students" FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Admins have full access to bookings" ON "bookings" FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Admins have full access to sessions" ON "sessions" FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Admins have full access to vehicles" ON "vehicles" FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Admins have full access to packages" ON "packages" FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Admins have full access to instructors" ON "instructors" FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Admins have full access to notifications" ON "notifications" FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
