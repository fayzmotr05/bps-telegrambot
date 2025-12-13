const { google } = require('googleapis');
const path = require('path');
const crypto = require('crypto');

/**
 * Centralized Google Authentication Service
 * Provides consistent authentication for all Google API services
 */
class GoogleAuthService {
    constructor() {
        this.auth = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Google Authentication with proper scopes
     */
    async initialize() {
        if (this.isInitialized && this.auth) {
            return this.auth;
        }

        try {
            console.log('🔐 Initializing Google Authentication...');
            
            // Required scopes for both Sheets and Drive access
            const scopes = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.readonly'
            ];

            // Prioritize individual env vars since that's what Railway has
            if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
                console.log('📊 Using GOOGLE_PRIVATE_KEY + GOOGLE_SERVICE_ACCOUNT_EMAIL');
                
                try {
                    // Extract project ID from email (format: name@project-id.iam.gserviceaccount.com)
                    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
                    const projectId = email.split('@')[1]?.split('.')[0] || 'bps-telegram-bot';
                    
                    // Clean up private key - handle different formats
                    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
                    
                    // If the key has literal \n, replace with actual newlines
                    if (privateKey.includes('\\n')) {
                        privateKey = privateKey.replace(/\\n/g, '\n');
                    }
                    
                    // Ensure proper formatting
                    if (!privateKey.includes('\n')) {
                        console.log('🔧 Formatting private key with proper newlines...');
                        // Add newlines after header and before footer
                        privateKey = privateKey
                            .replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n')
                            .replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
                        
                        // Add newlines every 64 characters for the key body
                        const header = '-----BEGIN PRIVATE KEY-----\n';
                        const footer = '\n-----END PRIVATE KEY-----';
                        const keyBody = privateKey
                            .replace(/-----BEGIN PRIVATE KEY-----\n?/g, '')
                            .replace(/\n?-----END PRIVATE KEY-----/g, '')
                            .replace(/\s/g, ''); // Remove any existing whitespace
                        
                        // Split into 64-char chunks
                        const chunks = keyBody.match(/.{1,64}/g) || [];
                        privateKey = header + chunks.join('\n') + footer;
                    }
                    
                    const serviceAccount = {
                        type: "service_account",
                        project_id: projectId,
                        private_key_id: "key-id-from-env",
                        private_key: privateKey,
                        client_email: email,
                        client_id: email.split('@')[0],
                        auth_uri: "https://accounts.google.com/o/oauth2/auth",
                        token_uri: "https://oauth2.googleapis.com/token",
                        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
                    };
                    
                    console.log('🔑 Service account email:', serviceAccount.client_email);
                    console.log('🔑 Project ID:', serviceAccount.project_id);
                    console.log('🔑 Private key length:', serviceAccount.private_key.length);
                    console.log('🔑 Private key starts correctly:', serviceAccount.private_key.startsWith('-----BEGIN PRIVATE KEY-----'));
                    console.log('🔑 Private key ends correctly:', serviceAccount.private_key.endsWith('-----END PRIVATE KEY-----'));
                    
                    this.auth = new google.auth.GoogleAuth({
                        credentials: serviceAccount,
                        scopes: scopes
                    });
                    
                } catch (error) {
                    console.error('❌ Error creating service account from env vars:', error.message);
                    throw error;
                }
                
            } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
                console.log('📊 Using GOOGLE_SERVICE_ACCOUNT JSON credentials');
                
                try {
                    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
                    console.log('🔑 Service account email:', credentials.client_email);
                    console.log('🔑 Project ID:', credentials.project_id);
                    
                    this.auth = new google.auth.GoogleAuth({
                        credentials: credentials,
                        scopes: scopes
                    });
                    
                } catch (parseError) {
                    console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT JSON:', parseError.message);
                    throw new Error(`Invalid GOOGLE_SERVICE_ACCOUNT JSON: ${parseError.message}`);
                }
                
            } else {
                console.log('❌ No Google credentials found!');
                console.log('🔍 Available env vars:');
                console.log('  - GOOGLE_PRIVATE_KEY:', !!process.env.GOOGLE_PRIVATE_KEY);
                console.log('  - GOOGLE_SERVICE_ACCOUNT_EMAIL:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
                console.log('  - GOOGLE_SERVICE_ACCOUNT:', !!process.env.GOOGLE_SERVICE_ACCOUNT);
                
                throw new Error('No Google credentials available. Please set GOOGLE_SERVICE_ACCOUNT environment variable.');
            }

            // Test authentication
            await this.testAuthentication();
            
            this.isInitialized = true;
            console.log('✅ Google Authentication initialized and tested successfully');
            
            return this.auth;
            
        } catch (error) {
            console.error('❌ Google Authentication failed:', error.message);
            this.auth = null;
            this.isInitialized = false;
            throw error;
        }
    }

    /**
     * Test authentication by making a simple API call
     */
    async testAuthentication() {
        try {
            if (!this.auth) {
                throw new Error('Auth not initialized');
            }

            console.log('🧪 Testing authentication...');
            
            // Try multiple methods to get access token
            let accessToken = null;
            
            // Method 1: Direct getAccessToken
            if (typeof this.auth.getAccessToken === 'function') {
                console.log('🔑 Trying direct getAccessToken...');
                try {
                    const tokenResponse = await this.auth.getAccessToken();
                    console.log('🔍 Token response type:', typeof tokenResponse);
                    console.log('🔍 Token response:', tokenResponse);
                    accessToken = tokenResponse?.token || tokenResponse;
                } catch (e) {
                    console.error('❌ Direct getAccessToken failed:', e.message);
                }
            }
            
            // Method 2: Get client and then access token
            if (!accessToken && typeof this.auth.getClient === 'function') {
                console.log('🔑 Trying getClient then getAccessToken...');
                try {
                    const client = await this.auth.getClient();
                    console.log('🔍 Client type:', typeof client);
                    console.log('🔍 Client methods:', Object.getOwnPropertyNames(client).filter(prop => typeof client[prop] === 'function'));
                    
                    if (client && typeof client.getAccessToken === 'function') {
                        const tokenResponse = await client.getAccessToken();
                        console.log('🔍 Client token response:', tokenResponse);
                        accessToken = tokenResponse?.token || tokenResponse;
                    }
                } catch (e) {
                    console.error('❌ getClient approach failed:', e.message);
                }
            }
            
            // Method 3: Get request headers
            if (!accessToken && typeof this.auth.getRequestHeaders === 'function') {
                console.log('🔑 Trying getRequestHeaders...');
                try {
                    const headers = await this.auth.getRequestHeaders();
                    console.log('🔍 Headers:', headers);
                    accessToken = headers.authorization?.replace('Bearer ', '');
                } catch (e) {
                    console.error('❌ getRequestHeaders failed:', e.message);
                }
            }
            
            console.log('🔑 Final access token length:', accessToken?.length || 0);
            console.log('🔑 Final access token type:', typeof accessToken);
            
            if (!accessToken) {
                throw new Error('Failed to get access token - all methods returned null/undefined');
            }
            
            console.log('🔑 Authentication test successful');
            return true;
            
        } catch (error) {
            console.error('❌ Authentication test failed:');
            console.error('  - Error type:', error.constructor.name);
            console.error('  - Error message:', error.message);
            console.error('  - Error code:', error.code);
            console.error('  - Error stack:', error.stack?.split('\n').slice(0, 3).join('\n'));
            if (error.response) {
                console.error('  - Response status:', error.response.status);
                console.error('  - Response data:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`Failed to get access token`);
        }
    }

    /**
     * Manual JWT token generation as fallback
     */
    async getAccessTokenManually() {
        try {
            console.log('🔧 Trying manual JWT token generation...');
            
            if (!process.env.GOOGLE_SERVICE_ACCOUNT) {
                throw new Error('GOOGLE_SERVICE_ACCOUNT not available for manual JWT');
            }
            
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
            
            const now = Math.floor(Date.now() / 1000);
            const payload = {
                iss: credentials.client_email,
                scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly',
                aud: 'https://oauth2.googleapis.com/token',
                exp: now + 3600,
                iat: now
            };
            
            const header = { alg: 'RS256', typ: 'JWT' };
            const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
            const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
            const signatureData = `${encodedHeader}.${encodedPayload}`;
            
            const signature = crypto.sign('RSA-SHA256', Buffer.from(signatureData), {
                key: credentials.private_key,
                padding: crypto.constants.RSA_PKCS1_PADDING
            });
            
            const encodedSignature = signature.toString('base64url');
            const jwt = `${signatureData}.${encodedSignature}`;
            
            console.log('🔧 JWT token created, length:', jwt.length);
            
            // Exchange JWT for access token
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
            });
            
            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                throw new Error(`Token exchange failed: ${tokenResponse.status} ${errorText}`);
            }
            
            const tokenData = await tokenResponse.json();
            console.log('🔧 Manual JWT token exchange successful');
            
            return tokenData.access_token;
            
        } catch (error) {
            console.error('❌ Manual JWT generation failed:', error.message);
            throw error;
        }
    }

    /**
     * Get access token for API calls
     */
    async getAccessToken() {
        try {
            if (!this.auth) {
                await this.initialize();
            }

            let accessToken = null;
            
            // Method 1: Direct getAccessToken
            if (typeof this.auth.getAccessToken === 'function') {
                try {
                    const tokenResponse = await this.auth.getAccessToken();
                    accessToken = tokenResponse?.token || tokenResponse;
                    if (accessToken) console.log('🔑 getAccessToken method successful');
                } catch (e) {
                    console.log('⚠️ getAccessToken failed, trying next method...');
                }
            }
            
            // Method 2: Get client and then access token
            if (!accessToken && typeof this.auth.getClient === 'function') {
                try {
                    const client = await this.auth.getClient();
                    if (client && typeof client.getAccessToken === 'function') {
                        const tokenResponse = await client.getAccessToken();
                        accessToken = tokenResponse?.token || tokenResponse;
                        if (accessToken) console.log('🔑 getClient method successful');
                    }
                } catch (e) {
                    console.log('⚠️ getClient failed, trying next method...');
                }
            }
            
            // Method 3: Get request headers
            if (!accessToken && typeof this.auth.getRequestHeaders === 'function') {
                try {
                    const headers = await this.auth.getRequestHeaders();
                    accessToken = headers.authorization?.replace('Bearer ', '');
                    if (accessToken) console.log('🔑 getRequestHeaders method successful');
                } catch (e) {
                    console.log('⚠️ getRequestHeaders failed, trying manual JWT...');
                }
            }
            
            // Method 4: Manual JWT as fallback
            if (!accessToken) {
                console.log('🔧 Standard methods failed, trying manual JWT...');
                try {
                    accessToken = await this.getAccessTokenManually();
                    console.log('🔧 Manual JWT successful - length:', accessToken?.length || 0);
                } catch (e) {
                    console.error('❌ Manual JWT also failed:', e.message);
                }
            }
            
            if (!accessToken) {
                throw new Error('Unable to get access token - all methods including manual JWT failed');
            }
            
            return accessToken;
            
        } catch (error) {
            console.error('❌ Access token error details:');
            console.error('  - Error message:', error.message);
            console.error('  - Error code:', error.code);
            console.error('  - Error stack:', error.stack?.split('\n')[0]);
            
            // Check for specific error types
            if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
                console.error('🌐 Network connectivity issue detected');
            } else if (error.message?.includes('unauthorized') || error.message?.includes('403')) {
                console.error('🔒 Authorization issue - check service account permissions');
            } else if (error.message?.includes('400')) {
                console.error('📝 Bad request - check service account configuration');
            }
            
            throw error;
        }
    }

    /**
     * Get authenticated Google Sheets API client
     */
    async getSheetsClient() {
        try {
            if (!this.auth) {
                await this.initialize();
            }
            
            return google.sheets({ version: 'v4', auth: this.auth });
            
        } catch (error) {
            console.error('❌ Failed to get Sheets client:', error.message);
            throw error;
        }
    }

    /**
     * Get authenticated Google Drive API client
     */
    async getDriveClient() {
        try {
            if (!this.auth) {
                await this.initialize();
            }
            
            return google.drive({ version: 'v3', auth: this.auth });
            
        } catch (error) {
            console.error('❌ Failed to get Drive client:', error.message);
            throw error;
        }
    }

    /**
     * Reset authentication (useful for error recovery)
     */
    reset() {
        this.auth = null;
        this.isInitialized = false;
        console.log('🔄 Google Authentication reset');
    }

    /**
     * Check if authentication is available
     */
    isAvailable() {
        return this.isInitialized && this.auth !== null;
    }
}

// Export singleton instance
module.exports = new GoogleAuthService();