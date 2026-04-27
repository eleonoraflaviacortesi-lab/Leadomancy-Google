import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useGoogleLogin, TokenResponse } from "@react-oauth/google";
import { gapi } from "gapi-script";
import { toast } from "sonner";
import { Profile } from "@/src/types/index";
import { getSheetData, appendRow, SHEETS, clearHeaderCache, findRowIndex, updateRow } from "@/src/lib/googleSheets";

interface AuthContextType {
  user: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isUsingFallback: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
  refreshUser: (updates: Partial<Profile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/sheets/v4/rest",
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

// Helper to ensure gapi is loaded
const waitForGapi = (): Promise<void> => {
  return new Promise((resolve) => {
    const check = () => {
      if (typeof window !== 'undefined' && (window as any).gapi) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  const checkAndRefreshScopes = async (token: string) => {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
      const info = await response.json();
      
      if (info.error) {
        console.error("[Auth] Token info error:", info.error);
        localStorage.removeItem('altair_access_token');
        return false;
      }

      const grantedScopes = info.scope || "";

      // Check if 'calendar' and 'tasks' scopes are present
      const hasCalendar = grantedScopes.includes('https://www.googleapis.com/auth/calendar');
      const hasTasks = grantedScopes.includes('https://www.googleapis.com/auth/tasks');

      if (!hasCalendar || !hasTasks) {
        console.warn("[Auth] Necessary scopes missing. Forcing re-login.");
        localStorage.removeItem('altair_access_token');
        const missing = !hasCalendar ? "calendario" : "task";
        toast.error(`Effettua di nuovo il login per abilitare ${missing} di Google`);
        setUser(null);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[Auth] Error checking scopes:", error);
      return false;
    }
  };

  useEffect(() => {
    const initClient = async () => {
      try {
        await waitForGapi();
        
        const g = (window as any).gapi;
        if (!g) {
          throw new Error("gapi not found on window after waitForGapi");
        }

        g.load('client', async () => {
          try {
            
            // We use init to load discovery docs. 
            // Note: We don't necessarily need clientId/apiKey here if we use setToken later,
            // but discoveryDocs are essential for gapi.client.sheets to exist.
            await g.client.init({
              discoveryDocs: DISCOVERY_DOCS,
            });
            
            
            // Explicitly load APIs as a secondary measure
            const loadApi = (name: string, version: string) => {
              return new Promise((resolve) => {
                g.client.load(name, version, () => resolve(true));
              });
            };

            if (!g.client.sheets) {
              await loadApi('sheets', 'v4');
            }
            if (!g.client.calendar) {
              await loadApi('calendar', 'v3');
            }
            
            
            clearHeaderCache();
            
            if (!g.client.sheets) {
              console.warn("[Auth] Sheets API still not found in gapi.client after load");
            }

            const token = localStorage.getItem('altair_access_token');
            if (token) {
              const scopesOk = await checkAndRefreshScopes(token);
              if (scopesOk) {
                g.client.setToken({ access_token: token });
                fetchUserProfile(token);
              } else {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          } catch (err) {
            console.error("[Auth] gapi.client.init or load error:", err);
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error("[Auth] Init error:", error);
        setIsLoading(false);
      }
    };
    initClient();
  }, []);

  const fetchUserProfile = async (accessToken: string) => {
    setIsLoading(true);
    let userInfo: any = null;
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!userInfoResponse.ok) {
        throw new Error(`Google userinfo fetch failed: ${userInfoResponse.status}`);
      }
      
      userInfo = await userInfoResponse.json();
      
      const email = userInfo.email;

      const users = await getSheetData<Profile>(SHEETS.users);
      
      let profile = users.find(u => 
        u.email?.toLowerCase().trim() === email.toLowerCase().trim()
      );

      if (!profile) {
        const newProfile: Profile = {
          id: crypto.randomUUID(),
          user_id: userInfo.sub,
          email: email,
          nome: userInfo.given_name || '',
          cognome: userInfo.family_name || '',
          full_name: userInfo.name || '',
          role: 'agente',
          sede: import.meta.env.VITE_DEFAULT_SEDE || 'Firenze',
          sedi: null,
          avatar_emoji: '⭐',
        };
        try {
          await appendRow(SHEETS.users, {
            ...newProfile,
            sedi: '',
          });
          toast.success('Profilo creato automaticamente. Benvenuto in Altair!');
          setIsUsingFallback(false);
        } catch (appendErr) {
          console.error('[Auth] Failed to create profile in sheet:', appendErr);
          toast.error('Profilo temporaneo — controlla la connessione al foglio');
          setIsUsingFallback(true);
        }
        profile = newProfile;
      } else {
        if (profile && profile.user_id !== userInfo.sub) {
          try {
            const rowIndex = await findRowIndex(SHEETS.users, profile.user_id || profile.id);
            if (rowIndex) {
              await updateRow(SHEETS.users, rowIndex, { user_id: userInfo.sub });
            }
            (profile as any).user_id = userInfo.sub;
          } catch (e) {
            console.warn('[Auth] Could not update user_id in sheet:', e);
          }
        }
        setIsUsingFallback(false);
      }

      setUser(profile);
      clearHeaderCache();
    } catch (error) {
      console.error("[Auth] CRITICAL ERROR in fetchUserProfile:", error);
      
      if (userInfo) {
        const fallbackProfile: Profile = {
          id: accessToken.slice(0, 8),
          user_id: userInfo.sub,
          email: userInfo.email,
          nome: userInfo.given_name || '',
          cognome: userInfo.family_name || '',
          full_name: userInfo.name || '',
          role: 'agente',
          sede: 'Firenze',
          sedi: null,
          avatar_emoji: '👤'
        };
        setUser(fallbackProfile);
        setIsUsingFallback(true);
      } else {
        console.error("[Auth] No userInfo available, clearing token.");
        localStorage.removeItem('altair_access_token');
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = useGoogleLogin({
    onSuccess: async (tokenResponse: TokenResponse) => {
      localStorage.setItem('altair_access_token', tokenResponse.access_token);
      
      await waitForGapi();
      gapi.client.setToken({ access_token: tokenResponse.access_token });
      
      await fetchUserProfile(tokenResponse.access_token);
    },
    onError: (error) => {
      console.error("Auth error (GoogleLogin):", error);
      toast.error(`Errore di autenticazione: ${error.error_description || error.error || 'Errore sconosciuto'}. Verifica la configurazione del Client ID.`);
    },
    scope: SCOPES,
  });

  const signOut = async () => {
    localStorage.removeItem('altair_access_token');
    try {
      const g = (window as any).gapi;
      if (g?.client) g.client.setToken(null);
    } catch(e) {}
    setUser(null);
    setIsUsingFallback(false);
    toast.success("Disconnessione effettuata");
    // Force immediate redirect — React state update may be delayed
    setTimeout(() => {
      window.location.href = '/auth';
    }, 300);
  };

  const refreshUser = (updates: Partial<Profile>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isUsingFallback,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
