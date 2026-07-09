import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://wfcxeudmruyxirooqwsh.supabase.co";
const SUPABASE_KEY = "sb_publishable_atN6KiZ70fkgqCD-ZBQHQQ_uol6wtC5";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
