import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://zczhwcdpqxyzzswzafrc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpjemh3Y2RwcXh5enpzd3phZnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTg5NTEsImV4cCI6MjA5MTYzNDk1MX0.01RUFXfDUMISGKFxcXg5m9WlbFNiDEVbYI8IYseYaTw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);