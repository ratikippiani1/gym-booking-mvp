import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://wuwrkjodafqljyyitovv.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1d3Jram9kYWZxbGp5eWl0b3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2OTIwNTcsImV4cCI6MjA4NTI2ODA1N30.bpj4DMbnQkKqamqTQIX_NIB3bFugyPVvBU7VB_fHTMg"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)



