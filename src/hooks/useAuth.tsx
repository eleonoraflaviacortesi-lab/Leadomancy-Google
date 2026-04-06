import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useGoogleLogin, TokenResponse } from "@react-oauth/google";
import { gapi } from "gapi-script";
import { toast } from "sonner";
import { Profile } from "@/src/types";
import { getSheetData, appendRow, SHEETS, clearHeaderCache } from "@/src/lib/googleSheets";

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
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

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
      console.log("[Auth] Checking granted scopes...");
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
      const info = await response.json();
      
      if (info.error) {
        console.error("[Auth] Token info error:", info.error);
        localStorage.removeItem('leadomancy_access_token');
        return false;
      }

      const grantedScopes = info.scope || "";
      console.log("[Auth] Granted scopes:", grantedScopes);

      // Check if 'calendar' scope is present (either full or events)
      if (!grantedScopes.includes('https://www.googleapis.com/auth/calendar')) {
        console.warn("[Auth] Calendar scope missing. Forcing re-login.");
        localStorage.removeItem('leadomancy_access_token');
        toast.error("Effettua di nuovo il login per abilitare il calendario");
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
        console.log("[Auth] Initializing gapi client...");
        await waitForGapi();
        
        const g = (window as any).gapi;
        if (!g) {
          throw new Error("gapi not found on window after waitForGapi");
        }

        g.load('client', async () => {
          try {
            console.log("[Auth] gapi.load('client') callback started");
            
            // We use init to load discovery docs. 
            // Note: We don't necessarily need clientId/apiKey here if we use setToken later,
            // but discoveryDocs are essential for gapi.client.sheets to exist.
            await g.client.init({
              discoveryDocs: DISCOVERY_DOCS,
            });
            
            console.log("[Auth] gapi.client.init finished");
            
            // Explicitly load APIs as a secondary measure
            const loadApi = (name: string, version: string) => {
              return new Promise((resolve) => {
                g.client.load(name, version, () => resolve(true));
              });
            };

            if (!g.client.sheets) {
              console.log("[Auth] Sheets API not found after init, loading via name/version...");
              await loadApi('sheets', 'v4');
            }
            if (!g.client.calendar) {
              console.log("[Auth] Calendar API not found after init, loading via name/version...");
              await loadApi('calendar', 'v3');
            }
            
            console.log("[Auth] API check - Sheets:", !!g.client.sheets, "Calendar:", !!g.client.calendar);
            
            clearHeaderCache();
            
            if (!g.client.sheets) {
              console.warn("[Auth] Sheets API still not found in gapi.client after load");
            }

            const token = localStorage.getItem('leadomancy_access_token');
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
    console.log("[Auth] Starting fetchUserProfile...");
    setIsLoading(true);
    let userInfo: any = null;
    try {
      console.log("[Auth] Step 1: Fetching userinfo from Google...");
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!userInfoResponse.ok) {
        throw new Error(`Google userinfo fetch failed: ${userInfoResponse.status}`);
      }
      
      userInfo = await userInfoResponse.json();
      console.log("[Auth] Step 1 Success: Userinfo received:", userInfo.email);
      
      const email = userInfo.email;

      console.log("[Auth] Step 2: Fetching profile from sheet 'users'...");
      const users = await getSheetData<Profile>(SHEETS.users);
      console.log("[Auth] Step 2 Success: Received", users.length, "users from sheet");
      
      let profile = users.find(u => u.email === email);

      if (!profile) {
        console.log("[Auth] Step 3: Profile not found in sheet, attempting to create default...");
        profile = {
          id: crypto.randomUUID(),
          user_id: userInfo.sub,
          email: email,
          nome: userInfo.given_name || '',
          cognome: userInfo.family_name || '',
          full_name: userInfo.name || '',
          role: 'agente',
          sede: 'Firenze',
          sedi: null,
          avatar_emoji: '👤'
        };
        
        try {
          await appendRow(SHEETS.users, profile);
          console.log("[Auth] Step 3 Success: Default profile created in sheet");
        } catch (appendErr) {
          console.error("[Auth] Step 3 Failed: Error appending profile to sheet:", appendErr);
          console.log("[Auth] Proceeding with local profile (fallback mode)");
          setIsUsingFallback(true);
        }
      } else {
        console.log("[Auth] Step 3 Success: Profile found in sheet");
        setIsUsingFallback(false);
      }

      console.log("[Auth] Final Step: Setting user profile...");
      setUser(profile);
      clearHeaderCache();
      console.log('[Auth] Header cache cleared on login');
    } catch (error) {
      console.error("[Auth] CRITICAL ERROR in fetchUserProfile:", error);
      
      if (userInfo) {
        console.log("[Auth] Using fallback profile due to error...");
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
        localStorage.removeItem('leadomancy_access_token');
        setUser(null);
      }
    } finally {
      console.log("[Auth] fetchUserProfile finished, setting isLoading to false");
      setIsLoading(false);
    }
  };

  const signIn = useGoogleLogin({
    onSuccess: async (tokenResponse: TokenResponse) => {
      console.log("OAuth success, token:", tokenResponse);
      localStorage.setItem('leadomancy_access_token', tokenResponse.access_token);
      
      await waitForGapi();
      gapi.client.setToken({ access_token: tokenResponse.access_token });
      
      await fetchUserProfile(tokenResponse.access_token);
    },
    onError: (error) => console.error("Auth error (GoogleLogin):", error),
    scope: SCOPES,
  });

  const signOut = async () => {
    console.log("[Auth] Signing out...");
    localStorage.removeItem('leadomancy_access_token');
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
