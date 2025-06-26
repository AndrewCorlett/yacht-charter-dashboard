-- Sample data for Yacht Charter Dashboard

-- Insert sample yachts
INSERT INTO yachts (name, yacht_type, length_feet, cabins, berths, engine_type, year_built, location, daily_rate, weekly_rate, description) VALUES
('Alrisha', 'Sailing Yacht', 45, 3, 6, 'Diesel', 2018, 'Southampton', 450.00, 2800.00, 'Beautiful 45ft sailing yacht perfect for coastal cruising'),
('Calico Moon', 'Motor Yacht', 52, 4, 8, 'Twin Diesel', 2020, 'Portsmouth', 650.00, 4200.00, 'Luxury motor yacht with excellent range and comfort'),
('Spectre', 'Sailing Yacht', 40, 2, 4, 'Diesel', 2016, 'Brighton', 380.00, 2300.00, 'Classic sailing yacht ideal for couples or small groups'),
('Disk Drive', 'Catamaran', 48, 4, 8, 'Twin Diesel', 2019, 'Southampton', 580.00, 3600.00, 'Spacious catamaran with excellent stability'),
('Mridula Sarwar', 'Sailing Yacht', 38, 2, 4, 'Diesel', 2017, 'Poole', 320.00, 1900.00, 'Comfortable yacht perfect for weekend getaways'),
('Zavaria', 'Motor Yacht', 55, 3, 6, 'Twin Diesel', 2021, 'Southampton', 750.00, 4800.00, 'Latest model luxury motor yacht'),
('Arriva', 'Sailing Yacht', 42, 3, 6, 'Diesel', 2015, 'Portsmouth', 400.00, 2500.00, 'Well-maintained sailing yacht with modern amenities');

-- Insert sample customers
INSERT INTO customers (first_name, surname, email, phone, address_line1, city, postcode, country) VALUES
('James', 'Smith', 'james.smith@email.com', '+44 7123 456789', '123 Marine Drive', 'Southampton', 'SO14 2AQ', 'United Kingdom'),
('Sarah', 'Johnson', 'sarah.johnson@email.com', '+44 7234 567890', '45 Harbour View', 'Portsmouth', 'PO1 3HX', 'United Kingdom'),
('Michael', 'Brown', 'michael.brown@email.com', '+44 7345 678901', '78 Coastal Road', 'Brighton', 'BN1 2FL', 'United Kingdom'),
('Emma', 'Davis', 'emma.davis@email.com', '+44 7456 789012', '12 Yacht Club Lane', 'Poole', 'BH15 1NZ', 'United Kingdom'),
('David', 'Wilson', 'david.wilson@email.com', '+44 7567 890123', '34 Marina Way', 'Cowes', 'PO31 7BH', 'United Kingdom');

-- Insert sample bookings
INSERT INTO bookings (
    booking_number, yacht_id, customer_id, charter_type, start_date, end_date, 
    port_of_departure, port_of_arrival, booking_status, payment_status,
    base_rate, total_amount, deposit_amount, balance_due,
    booking_confirmed, deposit_paid, contract_sent, special_requirements
) VALUES
-- Current bookings
('BK-2025-001', 
 (SELECT id FROM yachts WHERE name = 'Alrisha'), 
 (SELECT id FROM customers WHERE email = 'james.smith@email.com'),
 'bareboat', '2025-07-15', '2025-07-22', 'Southampton', 'Portsmouth',
 'confirmed', 'deposit_paid', 2800.00, 2800.00, 840.00, 1960.00,
 true, true, true, 'Experienced sailor, familiar with Solent waters'),

('BK-2025-002',
 (SELECT id FROM yachts WHERE name = 'Calico Moon'),
 (SELECT id FROM customers WHERE email = 'sarah.johnson@email.com'),
 'skippered charter', '2025-08-01', '2025-08-08', 'Portsmouth', 'Brighton',
 'confirmed', 'full_payment', 4200.00, 4700.00, 0.00, 0.00,
 true, true, true, 'First time charter, requires full briefing'),

('BK-2025-003',
 (SELECT id FROM yachts WHERE name = 'Spectre'),
 (SELECT id FROM customers WHERE email = 'michael.brown@email.com'),
 'bareboat', '2025-07-28', '2025-08-04', 'Brighton', 'Poole',
 'tentative', 'pending', 2300.00, 2300.00, 690.00, 1610.00,
 false, false, false, 'Weekend sailors, prefer calm weather'),

('BK-2025-004',
 (SELECT id FROM yachts WHERE name = 'Disk Drive'),
 (SELECT id FROM customers WHERE email = 'emma.davis@email.com'),
 'bareboat', '2025-09-10', '2025-09-17', 'Southampton', 'Cowes',
 'confirmed', 'deposit_paid', 3600.00, 3600.00, 1080.00, 2520.00,
 true, true, false, 'Family charter with children, safety equipment required'),

('BK-2025-005',
 (SELECT id FROM yachts WHERE name = 'Zavaria'),
 (SELECT id FROM customers WHERE email = 'david.wilson@email.com'),
 'skippered charter', '2025-08-15', '2025-08-22', 'Cowes', 'Southampton',
 'confirmed', 'deposit_paid', 4800.00, 5300.00, 1590.00, 3710.00,
 true, true, true, 'Corporate charter, entertainment facilities needed');

-- Insert sample pricing rules
INSERT INTO pricing_rules (yacht_id, rule_name, start_date, end_date, base_rate, seasonal_multiplier) VALUES
((SELECT id FROM yachts WHERE name = 'Alrisha'), 'Summer High Season', '2025-06-01', '2025-09-30', 450.00, 1.20),
((SELECT id FROM yachts WHERE name = 'Alrisha'), 'Winter Low Season', '2025-11-01', '2025-03-31', 450.00, 0.80),
((SELECT id FROM yachts WHERE name = 'Calico Moon'), 'Summer High Season', '2025-06-01', '2025-09-30', 650.00, 1.25),
((SELECT id FROM yachts WHERE name = 'Spectre'), 'Peak Summer', '2025-07-01', '2025-08-31', 380.00, 1.30);

-- Insert document templates
INSERT INTO document_templates (name, template_type, file_path) VALUES
('Standard Charter Contract', 'contract', '/templates/charter_contract.pdf'),
('Deposit Invoice Template', 'deposit_invoice', '/templates/deposit_invoice.pdf'),
('Final Invoice Template', 'final_invoice', '/templates/final_invoice.pdf'),
('Deposit Receipt Template', 'deposit_receipt', '/templates/deposit_receipt.pdf'),
('Handover Notes Template', 'handover_notes', '/templates/handover_notes.pdf');