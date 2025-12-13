const { google } = require('googleapis');
const path = require('path');

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

            if (process.env.GOOGLE_SERVICE_ACCOUNT) {
                console.log('📊 Using GOOGLE_SERVICE_ACCOUNT JSON credentials');
                
                try {
                    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
                    console.log('🔑 Service account email:', credentials.client_email);
                    console.log('🔑 Project ID:', credentials.project_id);
                    console.log('🔑 Has private key:', !!credentials.private_key);
                    
                    this.auth = new google.auth.GoogleAuth({
                        credentials: credentials,
                        scopes: scopes
                    });
                    
                } catch (parseError) {
                    console.error('❌ Failed to parse GOOGLE_SERVICE_ACCOUNT JSON:', parseError.message);
                    throw new Error(`Invalid GOOGLE_SERVICE_ACCOUNT JSON: ${parseError.message}`);
                }
                
            } else if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
                console.log('📊 Using individual environment variables');
                
                // Create service account object from environment variables
                const serviceAccount = {
                    type: "service_account",
                    project_id: "bps-telegram-bot",
                    private_key_id: "dummy-key-id",
                    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    client_id: "dummy-client-id",
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token",
                    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs"
                };
                
                console.log('🔑 Service account email:', serviceAccount.client_email);
                console.log('🔑 Private key length:', serviceAccount.private_key.length);
                
                this.auth = new google.auth.GoogleAuth({
                    credentials: serviceAccount,
                    scopes: scopes
                });
                
            } else {
                console.log('❌ No Google credentials found!');
                console.log('🔍 Available env vars:');
                console.log('  - GOOGLE_PRIVATE_KEY:', !!process.env.GOOGLE_PRIVATE_KEY);
                console.log('  - GOOGLE_SERVICE_ACCOUNT_EMAIL:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
                console.log('  - GOOGLE_SERVICE_ACCOUNT:', !!process.env.GOOGLE_SERVICE_ACCOUNT);
                
                throw new Error('No Google credentials available. Please set GOOGLE_PRIVATE_KEY and GOOGLE_SERVICE_ACCOUNT_EMAIL environment variables.');
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
            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Failed to get access token - token is null/undefined');
            }
            
            console.log('🔑 Authentication test successful');
            return true;
            
        } catch (error) {
            console.error('❌ Authentication test failed:');
            console.error('  - Error type:', error.constructor.name);
            console.error('  - Error message:', error.message);
            console.error('  - Error code:', error.code);
            if (error.response) {
                console.error('  - Response status:', error.response.status);
                console.error('  - Response data:', JSON.stringify(error.response.data, null, 2));
            }
            throw new Error(`Failed to get access token`);
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

            console.log('🔑 Getting access token...');
            console.log('📋 Auth object type:', this.auth.constructor.name);

            if (this.auth.getAccessToken) {
                // GoogleAuth method
                console.log('📊 Using GoogleAuth.getAccessToken() method');
                const tokenResponse = await this.auth.getAccessToken();
                console.log('✅ Token response received, length:', tokenResponse.token?.length || 0);
                return tokenResponse.token;
            } else if (this.auth.request) {
                // JWT method
                console.log('📊 Using JWT.getRequestHeaders() method');
                const headers = await this.auth.getRequestHeaders();
                const token = headers.authorization?.replace('Bearer ', '');
                console.log('✅ JWT token extracted, length:', token?.length || 0);
                return token;
            }
            
            throw new Error('Unable to get access token from auth object - no suitable method found');
            
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