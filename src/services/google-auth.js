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

            if (process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
                console.log('📊 Creating service account credentials from environment variables');
                
                // Create service account object from environment variables
                const serviceAccount = {
                    type: "service_account",
                    project_id: "bps-telegram-bot", // Extracted from email
                    private_key_id: "key-id", // Not critical for authentication
                    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    client_id: "client-id", // Not critical for authentication
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token"
                };
                
                console.log('🔑 Service account email:', serviceAccount.client_email);
                console.log('🔑 Private key length:', serviceAccount.private_key.length);
                console.log('🔑 Private key starts properly:', serviceAccount.private_key.startsWith('-----BEGIN PRIVATE KEY-----'));
                console.log('🔑 Private key ends properly:', serviceAccount.private_key.endsWith('-----END PRIVATE KEY-----'));
                
                this.auth = new google.auth.GoogleAuth({
                    credentials: serviceAccount,
                    scopes: scopes
                });
                
            } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
                console.log('📊 Using GoogleAuth with service account JSON');
                
                const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
                this.auth = new google.auth.GoogleAuth({
                    credentials: credentials,
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
        if (!this.auth) {
            throw new Error('Auth not initialized');
        }

        const accessToken = await this.getAccessToken();
        
        if (!accessToken) {
            throw new Error('Failed to get access token');
        }
        
        console.log('🔑 Authentication test successful');
        return true;
    }

    /**
     * Get access token for API calls
     */
    async getAccessToken() {
        if (!this.auth) {
            await this.initialize();
        }

        if (this.auth.getAccessToken) {
            // GoogleAuth method
            const tokenResponse = await this.auth.getAccessToken();
            return tokenResponse.token;
        } else if (this.auth.request) {
            // JWT method
            const headers = await this.auth.getRequestHeaders();
            return headers.authorization.replace('Bearer ', '');
        }
        
        throw new Error('Unable to get access token from auth object');
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