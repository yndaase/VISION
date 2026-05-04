/**
 * Supabase Client for Vision AI
 * Handles authentication and database operations
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Supabase configuration (will be loaded from environment)
const SUPABASE_URL = window.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

console.log('[Supabase] Client initialized');

// Export for global access
window.supabase = supabase;

/**
 * Sign in with Google OAuth
 */
window.sbSignInWithGoogle = async function() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/chat',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('[Supabase] Google sign-in error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Supabase] Google sign-in initiated');
    return { success: true, data };
  } catch (error) {
    console.error('[Supabase] Google sign-in exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get current user session
 */
window.sbGetSession = async function() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Supabase] Get session error:', error.message);
      return null;
    }

    if (session) {
      console.log('[Supabase] Session found:', session.user.email);
      return session;
    }

    console.log('[Supabase] No active session');
    return null;
  } catch (error) {
    console.error('[Supabase] Get session exception:', error);
    return null;
  }
};

/**
 * Get current authenticated user
 */
window.sbGetUser = async function() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[Supabase] Get user error:', error.message);
      return null;
    }

    if (user) {
      console.log('[Supabase] User authenticated:', user.email);
      return user;
    }

    console.log('[Supabase] No authenticated user');
    return null;
  } catch (error) {
    console.error('[Supabase] Get user exception:', error);
    return null;
  }
};

/**
 * Sign out
 */
window.sbSignOut = async function() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[Supabase] Sign out error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('[Supabase] User signed out');
    return { success: true };
  } catch (error) {
    console.error('[Supabase] Sign out exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save a chat message to Supabase
 */
window.sbSaveMessage = async function(userEmail, sessionId, message) {
  if (!userEmail || !sessionId || !message) {
    console.warn('[Supabase] Missing required parameters for saveMessage');
    return { success: false, error: 'Missing parameters' };
  }

  try {
    const user = await window.sbGetUser();
    if (!user) {
      console.warn('[Supabase] User not authenticated');
      return { success: false, error: 'Not authenticated' };
    }

    // Insert message
    const { data: messageData, error: messageError } = await supabase
      .from('vision_ai_messages')
      .insert({
        user_id: user.id,
        user_email: userEmail.toLowerCase(),
        session_id: sessionId,
        role: message.role,
        content: message.content,
        source: message.source || null,
        timestamp: message.timestamp || Date.now()
      })
      .select()
      .single();

    if (messageError) {
      console.error('[Supabase] Save message error:', messageError.message);
      return { success: false, error: messageError.message };
    }

    // Update or create session
    const { error: sessionError } = await supabase
      .from('vision_ai_sessions')
      .upsert({
        user_id: user.id,
        user_email: userEmail.toLowerCase(),
        session_id: sessionId,
        last_message: message.content.substring(0, 100),
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      });

    if (sessionError) {
      console.warn('[Supabase] Update session warning:', sessionError.message);
    }

    // Update message count
    const { error: countError } = await supabase.rpc('increment_message_count', {
      p_session_id: sessionId
    }).catch(() => {
      // Fallback: manually update count
      supabase
        .from('vision_ai_sessions')
        .update({ message_count: supabase.raw('message_count + 1') })
        .eq('session_id', sessionId)
        .then(() => {});
    });

    console.log('[Supabase] Message saved successfully');
    return { success: true, data: messageData };
  } catch (error) {
    console.error('[Supabase] Save message exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Load chat history for a session
 */
window.sbLoadHistory = async function(userEmail, sessionId) {
  if (!userEmail || !sessionId) {
    console.warn('[Supabase] Missing required parameters for loadHistory');
    return [];
  }

  try {
    const user = await window.sbGetUser();
    if (!user) {
      console.warn('[Supabase] User not authenticated');
      return [];
    }

    const { data, error } = await supabase
      .from('vision_ai_messages')
      .select('*')
      .eq('user_email', userEmail.toLowerCase())
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('[Supabase] Load history error:', error.message);
      return [];
    }

    console.log(`[Supabase] Loaded ${data.length} messages for session ${sessionId}`);
    return data;
  } catch (error) {
    console.error('[Supabase] Load history exception:', error);
    return [];
  }
};

/**
 * Get all chat sessions for a user
 */
window.sbGetSessions = async function(userEmail) {
  if (!userEmail) {
    console.warn('[Supabase] Missing userEmail for getSessions');
    return [];
  }

  try {
    const user = await window.sbGetUser();
    if (!user) {
      console.warn('[Supabase] User not authenticated');
      return [];
    }

    const { data, error } = await supabase
      .from('vision_ai_sessions')
      .select('*')
      .eq('user_email', userEmail.toLowerCase())
      .order('last_updated', { ascending: false })
      .limit(50);

    if (error) {
      console.error('[Supabase] Get sessions error:', error.message);
      return [];
    }

    console.log(`[Supabase] Loaded ${data.length} sessions`);
    return data;
  } catch (error) {
    console.error('[Supabase] Get sessions exception:', error);
    return [];
  }
};

/**
 * Delete a chat session and all its messages
 */
window.sbDeleteSession = async function(userEmail, sessionId) {
  if (!userEmail || !sessionId) {
    console.warn('[Supabase] Missing required parameters for deleteSession');
    return { success: false, error: 'Missing parameters' };
  }

  try {
    const user = await window.sbGetUser();
    if (!user) {
      console.warn('[Supabase] User not authenticated');
      return { success: false, error: 'Not authenticated' };
    }

    // Delete messages (cascade will handle this, but explicit is better)
    const { error: messagesError } = await supabase
      .from('vision_ai_messages')
      .delete()
      .eq('user_email', userEmail.toLowerCase())
      .eq('session_id', sessionId);

    if (messagesError) {
      console.error('[Supabase] Delete messages error:', messagesError.message);
    }

    // Delete session
    const { error: sessionError } = await supabase
      .from('vision_ai_sessions')
      .delete()
      .eq('user_email', userEmail.toLowerCase())
      .eq('session_id', sessionId);

    if (sessionError) {
      console.error('[Supabase] Delete session error:', sessionError.message);
      return { success: false, error: sessionError.message };
    }

    console.log('[Supabase] Session deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('[Supabase] Delete session exception:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Listen for auth state changes
 */
supabase.auth.onAuthStateChange((event, session) => {
  console.log('[Supabase] Auth state changed:', event);
  
  if (event === 'SIGNED_IN' && session) {
    console.log('[Supabase] User signed in:', session.user.email);
    
    // Store user info in localStorage for compatibility
    const user = {
      name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
      email: session.user.email,
      picture: session.user.user_metadata?.avatar_url || '',
      provider: 'google',
      sub: session.user.id,
      role: 'student'
    };
    
    sessionStorage.setItem('waec_session', JSON.stringify(user));
    localStorage.setItem('waec_session', JSON.stringify(user));
  } else if (event === 'SIGNED_OUT') {
    console.log('[Supabase] User signed out');
    sessionStorage.removeItem('waec_session');
    localStorage.removeItem('waec_session');
  }
});

// Check for existing session on load
(async () => {
  const session = await window.sbGetSession();
  if (session) {
    console.log('[Supabase] Existing session restored:', session.user.email);
  }
})();

console.log('[Supabase] Client ready');
