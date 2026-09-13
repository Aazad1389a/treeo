import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL='https://pzvayflxdicppwrcfnwy.supabase.co';
const SUPABASE_KEY='sb_publishable_yF7Jp-goS1v7B4spb1XxPA_EYEjqAcu';

let client=null;

export function getSupabase(){
  if(!client)client=createClient(SUPABASE_URL,SUPABASE_KEY);
  return client;
}
