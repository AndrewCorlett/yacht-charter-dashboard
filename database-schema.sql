-- Yacht Charter Dashboard Database Schema
-- Management system for yacht charter bookings and operations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE charter_type AS ENUM ('bareboat', 'skippered charter');
CREATE TYPE booking_status AS ENUM ('tentative', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'deposit_paid', 'full_payment', 'refunded');

-- Yachts table
CREATE TABLE yachts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    yacht_type TEXT,
    length_feet INTEGER,
    cabins INTEGER,
    berths INTEGER,
    engine_type TEXT,
    year_built INTEGER,
    location TEXT,
    daily_rate DECIMAL(10,2),
    weekly_rate DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    surname TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    postcode TEXT,
    country TEXT DEFAULT 'United Kingdom',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number TEXT UNIQUE NOT NULL,
    yacht_id UUID NOT NULL REFERENCES yachts(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    
    -- Booking details
    charter_type charter_type NOT NULL DEFAULT 'bareboat',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    port_of_departure TEXT,
    port_of_arrival TEXT,
    
    -- Status tracking
    booking_status booking_status NOT NULL DEFAULT 'tentative',
    payment_status payment_status NOT NULL DEFAULT 'pending',
    
    -- Pricing
    base_rate DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2),
    balance_due DECIMAL(10,2),
    
    -- Status flags
    booking_confirmed BOOLEAN DEFAULT FALSE,
    deposit_paid BOOLEAN DEFAULT FALSE,
    contract_sent BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    deposit_invoice_sent BOOLEAN DEFAULT FALSE,
    receipt_issued BOOLEAN DEFAULT FALSE,
    
    -- Crew experience file
    crew_experience_file_name TEXT,
    crew_experience_file_url TEXT,
    crew_experience_file_size INTEGER,
    
    -- Additional data
    special_requirements TEXT,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Charter pricing rules
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    yacht_id UUID REFERENCES yachts(id) ON DELETE CASCADE,
    rule_name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    base_rate DECIMAL(10,2) NOT NULL,
    seasonal_multiplier DECIMAL(3,2) DEFAULT 1.00,
    minimum_days INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document templates
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    template_type TEXT NOT NULL, -- 'contract', 'invoice', 'receipt', etc.
    file_path TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated documents
CREATE TABLE generated_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    downloaded_at TIMESTAMP WITH TIME ZONE,
    is_final BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_bookings_yacht ON bookings(yacht_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX idx_yachts_active ON yachts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_pricing_rules_yacht ON pricing_rules(yacht_id);
CREATE INDEX idx_pricing_rules_dates ON pricing_rules(start_date, end_date);
CREATE INDEX idx_generated_documents_booking ON generated_documents(booking_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_yachts_updated_at BEFORE UPDATE ON yachts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pricing_rules_updated_at BEFORE UPDATE ON pricing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (to be configured based on auth requirements)
ALTER TABLE yachts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Basic policies (allow all for now - to be refined based on auth requirements)
CREATE POLICY "Allow all operations on yachts" ON yachts FOR ALL USING (true);
CREATE POLICY "Allow all operations on customers" ON customers FOR ALL USING (true);
CREATE POLICY "Allow all operations on bookings" ON bookings FOR ALL USING (true);
CREATE POLICY "Allow all operations on pricing_rules" ON pricing_rules FOR ALL USING (true);
CREATE POLICY "Allow all operations on document_templates" ON document_templates FOR ALL USING (true);
CREATE POLICY "Allow all operations on generated_documents" ON generated_documents FOR ALL USING (true);