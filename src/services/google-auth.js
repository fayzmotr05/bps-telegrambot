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
                console.log('📊 Using JWT authentication with environment variables');
                
                this.auth = new google.auth.JWT(
                    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                    null,
                    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    scopes
                );
                
            } else if (process.env.GOOGLE_SERVICE_ACCOUNT) {
                console.log('📊 Using GoogleAuth with service account JSON');
                
                const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
                this.auth = new google.auth.GoogleAuth({
                    credentials: credentials,
                    scopes: scopes
                });
                
            } else {
                console.log('📊 Using local credentials file (development only)');
                
                const credentialsPath = path.join(__dirname, '../../bps-user-data-bot-dc3f9a88a80d.json');
                this.auth = new google.auth.GoogleAuth({
                    keyFile: credentialsPath,
                    scopes: scopes
                });
            }

            // Test authentication
            await this.testAuthentication();
            
            this.isInitialized = true;
            console.log('✅ Google Authentication initialized successfully');
            
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

            // Get access token to test auth
            const accessToken = await this.getAccessToken();
            
            if (!accessToken) {
                throw new Error('Failed to get access token');
            }
            
            console.log('🔑 Authentication test successful');
            return true;
            
        } catch (error) {
            console.error('❌ Authentication test failed:', error.message);
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
            
        } catch (error) {
            console.error('❌ Failed to get access token:', error.message);
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