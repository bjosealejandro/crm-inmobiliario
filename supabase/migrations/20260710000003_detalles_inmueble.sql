alter table inmuebles
  add column if not exists pisos int,
  add column if not exists antiguedad_anios int,
  add column if not exists material_piso text;
