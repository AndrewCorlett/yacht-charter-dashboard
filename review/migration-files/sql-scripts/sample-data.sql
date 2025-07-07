-- Sample data for Yacht Charter Dashboard - Clean start with yacht names only

-- Insert yacht names (preserving real yacht identifiers)
INSERT INTO yachts (name, yacht_type, length_feet, cabins, berths, engine_type, year_built, location, daily_rate, weekly_rate, description) VALUES
('Alrisha', 'Sailing Yacht', 0, 0, 0, '', 0, '', 0.00, 0.00, ''),
('Calico Moon', 'Motor Yacht', 0, 0, 0, '', 0, '', 0.00, 0.00, ''),
('Spectre', 'Sailing Yacht', 0, 0, 0, '', 0, '', 0.00, 0.00, ''),
('Disk Drive', 'Catamaran', 0, 0, 0, '', 0, '', 0.00, 0.00, ''),
('Mridula Sarwar', 'Sailing Yacht', 0, 0, 0, '', 0, '', 0.00, 0.00, ''),
('Zavaria', 'Motor Yacht', 0, 0, 0, '', 0, '', 0.00, 0.00, '');

-- No sample customers, bookings, pricing rules, or documents
-- Clean database ready for real data entry