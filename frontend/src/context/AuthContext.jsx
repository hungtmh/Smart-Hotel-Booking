import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

/**
 * AuthProvider boc toan bo ung dung de quan ly trang thai dang nhap.
 * Su dung Supabase Auth de theo doi session va tu dong refresh token.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase auth user
  const [profile, setProfile] = useState(null);  // Profile tu backend
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiem tra session hien tai khi component mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Lang nghe su kien thay doi trang thai xac thuc (dang nhap/dang xuat)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.access_token);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Goi API GET /api/auth/me cua Spring Boot de lay profile va role.
   */
  async function fetchProfile(accessToken) {
    try {
      const res = await fetch('http://localhost:8080/api/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Loi khi lay profile:', err);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Dang nhap bang email va password thong qua Supabase Auth.
   */
  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  /**
   * Dang ky tai khoan moi voi ho ten, email va mat khau.
   * full_name duoc luu vao raw_user_meta_data de trigger tu dong tao profile.
   */
  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) throw error;
    return data;
  }

  /**
   * Dang xuat nguoi dung.
   */
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  }

  // isAdmin = true neu profile.role la ADMIN
  const isAdmin = profile?.role === 'ADMIN';

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook de truy cap AuthContext tu bat ky component nao.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phai duoc su dung ben trong AuthProvider');
  }
  return context;
}
