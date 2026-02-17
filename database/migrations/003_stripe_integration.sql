-- Stripe Integration Migration
-- User profiles with token balance and subscription management

-- User profiles with token balance
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  email TEXT,
  tokens INTEGER DEFAULT 0,
  subscription_status TEXT DEFAULT 'free', -- 'free', 'pro', 'cancelled'
  subscription_id TEXT UNIQUE, -- Stripe subscription ID
  customer_id TEXT UNIQUE, -- Stripe customer ID
  subscription_current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token transactions log
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id),
  amount INTEGER NOT NULL, -- positive for purchases, negative for usage
  transaction_type TEXT NOT NULL, -- 'purchase', 'game_creation', 'ai_chat', 'image_generation', 'subscription_grant', 'voice_transcription'
  description TEXT,
  game_session_id UUID REFERENCES game_sessions(id),
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Token pricing tiers
CREATE TABLE IF NOT EXISTS token_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tokens INTEGER NOT NULL,
  price_cents INTEGER NOT NULL, -- price in cents
  stripe_price_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT true,
  bonus_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default token packages
INSERT INTO token_packages (name, tokens, price_cents, bonus_percentage, is_active) VALUES
  ('Starter Pack', 500, 500, 0, true),
  ('Popular Pack', 1200, 1000, 20, true),
  ('Power Pack', 3000, 2000, 50, true)
ON CONFLICT DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_customer_id ON user_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_id ON user_profiles(subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_status ON user_profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_transactions_type ON token_transactions(transaction_type);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- RLS policies for token_transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON token_transactions;
CREATE POLICY "Users can view own transactions"
  ON token_transactions FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

DROP POLICY IF EXISTS "Users can insert own transactions" ON token_transactions;
CREATE POLICY "Users can insert own transactions"
  ON token_transactions FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- RLS policies for token_packages
DROP POLICY IF EXISTS "Anyone can view active packages" ON token_packages;
CREATE POLICY "Anyone can view active packages"
  ON token_packages FOR SELECT
  USING (is_active = true);

-- Trigger for updated_at on user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user has sufficient tokens or is pro
CREATE OR REPLACE FUNCTION has_sufficient_tokens(
  p_user_id TEXT,
  p_required_tokens INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_status TEXT;
  v_tokens INTEGER;
BEGIN
  SELECT subscription_status, tokens INTO v_subscription_status, v_tokens
  FROM user_profiles
  WHERE user_id = p_user_id;
  
  -- Pro users have unlimited tokens
  IF v_subscription_status = 'pro' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user has enough tokens
  RETURN v_tokens >= p_required_tokens;
END;
$$ LANGUAGE plpgsql;
