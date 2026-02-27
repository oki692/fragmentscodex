import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://rwyxiutjqireuhybnzlv.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eXhpdXRqcWlyZXVoeWJuemx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjY4MzcsImV4cCI6MjA4NzQ0MjgzN30.mFzaBCYBxx2PaXwhqE2aoU8jjZI1uj2YpYrL-HldFKk"
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3eXhpdXRqcWlyZXVoeWJuemx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg2NjgzNywiZXhwIjoyMDg3NDQyODM3fQ.XI7VsP0rTOyivOP7tPGI5lv6u_ReKzBlIC4KSaID3wA"
const SUPABASE_JWT_SECRET = "TOZHjVSzmcV92UbIwngc8ShBcotoel8eQu44qO918LJKNzg1M86PAlQaB8f1TbUYKKwJx5W7fbZsePQifx5l2w=="
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_RPHoA4R7ynX7MuWwpSUTAg_uJzb7Igf"
const SUPABASE_SECRET_KEY = "sb_secret_Fl_ATwefmmY3XcrwqvfvxQ_jObKKtaR"
const POSTGRES_URL = "postgres://postgres.rwyxiutjqireuhybnzlv:5QwYr2zf0lvJRx6J@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
const POSTGRES_URL_NON_POOLING = "postgres://postgres.rwyxiutjqireuhybnzlv:5QwYr2zf0lvJRx6J@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres?sslmode=require"
const POSTGRES_PRISMA_URL = "postgres://postgres.rwyxiutjqireuhybnzlv:5QwYr2zf0lvJRx6J@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
const POSTGRES_HOST = "db.rwyxiutjqireuhybnzlv.supabase.co"
const POSTGRES_USER = "postgres"
const POSTGRES_PASSWORD = "5QwYr2zf0lvJRx6J"
const POSTGRES_DATABASE = "postgres"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
