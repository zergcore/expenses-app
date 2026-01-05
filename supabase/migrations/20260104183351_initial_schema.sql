-- Enable pg_cron only (uuid-ossp is not needed for v4 in modern postgres or supabase handles it)
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    currency_preference TEXT DEFAULT 'USD', -- 'USD', 'VES', 'USDT'
    theme_preference TEXT DEFAULT 'system',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table (Hierarchical)
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE, -- For hierarchy (e.g., Health -> Medicines)
    name TEXT NOT NULL,
    icon TEXT, -- Emoji or icon name
    color TEXT, -- Hex code
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table
CREATE TABLE public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- NULL = Global budget
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    period TEXT DEFAULT 'monthly', -- 'monthly', 'weekly', 'yearly'
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT NOT NULL, -- 'USD', 'VES', 'USDT'
    exchange_rate DECIMAL(12, 4), -- Rate at time of transaction (to USD)
    amount_usd DECIMAL(12, 2), -- Calculated USD amount
    description TEXT,
    date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    invoice_image_url TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'budget_alert', 'rate_alert', 'system'
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB, -- Additional data (e.g., related expense_id)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE public.notification_preferences (
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
    budget_alerts BOOLEAN DEFAULT TRUE,
    budget_threshold INTEGER DEFAULT 80, -- Percentage
    rate_alerts BOOLEAN DEFAULT FALSE,
    rate_threshold DECIMAL(5, 2) DEFAULT 5.0, -- Percentage change
    unusual_spending_alerts BOOLEAN DEFAULT TRUE,
    push_subscription JSONB, -- Web Push subscription object
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exchange Rates (Shared Data)
CREATE TABLE public.exchange_rates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL, -- 'BCV', 'Binance', 'Parallel'
    pair TEXT NOT NULL, -- 'USD/VES', 'USDT/VES'
    rate DECIMAL(12, 4) NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trading Insights (Shared Data)
CREATE TABLE public.trading_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pair TEXT NOT NULL,
    best_buy_hour INTEGER,
    best_sell_hour INTEGER,
    confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    analysis_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Categories
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Budgets
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Expenses
CREATE POLICY "Users can view own expenses" ON public.expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Notification Preferences
CREATE POLICY "Users can view own preferences" ON public.notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public Data (Read-only for authenticated users)
CREATE POLICY "Public read exchange rates" ON public.exchange_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read trading insights" ON public.trading_insights FOR SELECT TO authenticated USING (true);

-- Functions and Triggers

-- Handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    health_id UUID;
    pets_id UUID;
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');

    -- Default Parent Categories
    INSERT INTO public.categories (user_id, name, icon, color, is_default) VALUES
    (NEW.id, 'Food & Drink', '🍔', '#EF4444', true),
    (NEW.id, 'Transportation', '🚗', '#3B82F6', true),
    (NEW.id, 'Housing', '🏠', '#10B981', true),
    (NEW.id, 'Entertainment', '🎬', '#8B5CF6', true),
    (NEW.id, 'Shopping', '🛍️', '#F59E0B', true),
    (NEW.id, 'Other', '📦', '#6B7280', true);
    
    -- Insert Health and capture ID
    INSERT INTO public.categories (user_id, name, icon, color, is_default)
    VALUES (NEW.id, 'Health', '❤️', '#EC4899', true)
    RETURNING id INTO health_id;

    -- Insert Pets and capture ID
    INSERT INTO public.categories (user_id, name, icon, color, is_default)
    VALUES (NEW.id, 'Pets', '🐾', '#A855F7', true)
    RETURNING id INTO pets_id;

    -- Insert Subcategories
    INSERT INTO public.categories (user_id, parent_id, name, icon, color, is_default) VALUES
    (NEW.id, health_id, 'Medicines', '💊', '#EC4899', true),
    (NEW.id, health_id, 'Doctors', '👨‍⚕️', '#EC4899', true),
    (NEW.id, pets_id, 'Food', '🦴', '#A855F7', true),
    (NEW.id, pets_id, 'Toys', '🎾', '#A855F7', true),
    (NEW.id, pets_id, 'Vet', '🩺', '#A855F7', true);
    
    -- Default Preferences
    INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_modtime BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_modtime BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
