import { Configuration, PopupRequest } from '@azure/msal-browser';

// Config object to be passed to Msal on creation
export const msalConfig: Configuration = {
  auth: {
    // TODO: Replace with your actual Client ID from Microsoft Entra ID
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || 'YOUR_MICROSOFT_CLIENT_ID_HERE',
    // TODO: Replace with your Tenant ID if you only want YOUR organization to log in. 
    // Use 'common' for any Microsoft account.
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Scopes required to read the user's files from SharePoint via Microsoft Graph
export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'Files.Read.All', 'Sites.Read.All'],
};
