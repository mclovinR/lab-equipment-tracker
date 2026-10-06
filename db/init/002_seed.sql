-- Sample data so the API returns something right away.

INSERT INTO users (full_name, email, role) VALUES
  ('Ana López', 'ana@lab.local', 'researcher'),
  ('Luis Pérez', 'luis@lab.local', 'student'),
  ('Lab Admin', 'admin@lab.local', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO equipment (name, category, location) VALUES
  ('Rigol DS1054Z Oscilloscope', 'measurement', 'Bench 1'),
  ('Raspberry Pi 5 + Hailo-8L', 'computing', 'Cabinet A'),
  ('Prusa MK4 3D Printer', 'fabrication', 'Maker corner'),
  ('ESP32 DevKit (x10)', 'microcontrollers', 'Cabinet B');
