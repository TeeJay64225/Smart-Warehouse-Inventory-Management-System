const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Wrapper for rest API calls
const query = async (table, options = {}) => {
  try {
    const result = await supabase
      .from(table)
      .select(options.select || '*')
      .where(options.where || '')
      .order(options.order || '')
      .limit(options.limit || 1000);
    
    if (result.error) throw result.error;
    return { rows: result.data || [] };
  } catch (err) {
    console.error('Supabase query error:', err);
    throw err;
  }
};

module.exports = { supabase, query };
