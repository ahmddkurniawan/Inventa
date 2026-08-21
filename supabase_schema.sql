-- Inventa Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: locations
CREATE TABLE locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    capacity INTEGER,
    status TEXT NOT NULL,
    manager TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: suppliers
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    category TEXT,
    status TEXT NOT NULL,
    rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: items
CREATE TABLE items (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    unit TEXT NOT NULL,
    cost_price NUMERIC NOT NULL,
    selling_price NUMERIC,
    current_stock INTEGER NOT NULL,
    min_stock INTEGER NOT NULL,
    max_stock INTEGER,
    location TEXT,
    status TEXT NOT NULL,
    supplier_name TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    total_sold_this_month INTEGER DEFAULT 0
);

-- Table: movements
CREATE TABLE movements (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    item_sku TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit TEXT NOT NULL,
    unit_cost NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    source_location TEXT,
    destination_location TEXT,
    operator TEXT NOT NULL,
    supplier_or_recipient TEXT,
    reference_number TEXT,
    notes TEXT
);

-- Note: Ensure you set up RLS (Row Level Security) if accessing from client directly.
-- Since we are accessing it from the Vercel serverless function (Backend), RLS can be bypassed using the Service Role Key, 
-- or we can disable RLS if only accessed via our secure backend.
