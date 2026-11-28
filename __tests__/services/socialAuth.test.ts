const mockSecrets=new Map<string,string>();
const mockBrowser=jest.fn();const mockWrite=jest.fn(async(_value:string)=>{}),mockRead=jest.fn(async()=>null),mockClear=jest.fn(async()=>{});
const mockFetch=jest.fn();
jest.mock('expo-secure-store',()=>({getItemAsync:jest.fn(async(key:string)=>mockSecrets.get(key)??null),setItemAsync:jest.fn(async(key:string,value:string)=>{mockSecrets.set(key,value);}),deleteItemAsync:jest.fn(async(key:string)=>{mockSecrets.delete(key);}),WHEN_UNLOCKED_THIS_DEVICE_ONLY:1}));
jest.mock('expo-crypto',()=>({getRandomBytes:()=>new Uint8Array(32).fill(123),randomUUID:()=> 'test-flow',digestStringAsync:jest.fn(async()=> 'abc+/=='),CryptoDigestAlgorithm:{SHA256:'SHA-256'},CryptoEncoding:{BASE64:'base64'}}));
jest.mock('expo-web-browser',()=>({openAuthSessionAsync:(...args:unknown[])=>mockBrowser(...args)}));
jest.mock('@/services/secureSessionStorage',()=>({writeAccountSession:(value:string)=>mockWrite(value),readAccountSession:()=>mockRead(),clearAccountSession:()=>mockClear()}));
const oldFetch=global.fetch;
const env={flag:process.env.EXPO_PUBLIC_SOCIAL_AUTH_ENABLED,url:process.env.EXPO_PUBLIC_SUPABASE_URL,key:process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY};
function service(){let auth:typeof import('@/services/socialAuth');jest.isolateModules(()=>{auth=jest.requireActual('@/services/socialAuth');});return auth!;}
beforeEach(()=>{jest.clearAllMocks();mockSecrets.clear();global.fetch=mockFetch;process.env.EXPO_PUBLIC_SOCIAL_AUTH_ENABLED='true';process.env.EXPO_PUBLIC_SUPABASE_URL='https://test.supabase.co';process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY='sb_publishable_synthetic';});
afterEach(()=>{global.fetch=oldFetch;for(const [key,value]of Object.entries({EXPO_PUBLIC_SOCIAL_AUTH_ENABLED:env.flag,EXPO_PUBLIC_SUPABASE_URL:env.url,EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:env.key})){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
it('keeps unfinished social authentication disabled without transmitting data',async()=>{
 process.env.EXPO_PUBLIC_SOCIAL_AUTH_ENABLED='false';const auth=service();expect(auth.socialSignInConfigured()).toBe(false);
 await expect(auth.signInWithProvider('google')).rejects.toThrow('not_configured');expect(mockBrowser).not.toHaveBeenCalled();expect(mockFetch).not.toHaveBeenCalled();
});
it('uses an S256 PKCE challenge, stores the resulting account securely and never sends the baby journal',async()=>{
 mockBrowser.mockResolvedValue({type:'success',url:'nursingqueen:///auth/callback?flow=test-flow&code=synthetic-code'});
 mockFetch.mockResolvedValue({ok:true,json:async()=>({access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600,user:{id:'user',email:'synthetic@example.com'}})});
 const auth=service();await auth.signInWithProvider('google');
 expect(mockBrowser.mock.calls[0][0]).toContain('code_challenge_method=s256');expect(mockBrowser.mock.calls[0][0]).toContain('provider=google');
 const body=JSON.parse(mockFetch.mock.calls[0][1].body);expect(Object.keys(body).sort()).toEqual(['auth_code','code_verifier']);expect(body.code_verifier).toHaveLength(64);expect(mockWrite).toHaveBeenCalledWith(expect.stringContaining('synthetic-access'));expect(mockSecrets.size).toBe(0);
});
it('rejects a callback with a mismatched nonce before exchanging or storing anything',async()=>{
 mockBrowser.mockResolvedValue({type:'success',url:'nursingqueen:///auth/callback?flow=wrong-flow&code=synthetic-code'});
 await expect(service().signInWithProvider('apple')).rejects.toThrow('invalid_callback');expect(mockFetch).not.toHaveBeenCalled();expect(mockWrite).not.toHaveBeenCalled();
});
it('handles cancellation without creating a session',async()=>{
 mockBrowser.mockResolvedValue({type:'cancel'});expect(await service().signInWithProvider('apple')).toBeNull();expect(mockSecrets.size).toBe(0);expect(mockFetch).not.toHaveBeenCalled();
});
