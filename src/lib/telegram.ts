/**
 * Telegram Mini App SDK Integration
 */

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp;
    };
  }
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isProgressVisible: boolean;
    isActive: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: (leaveActive: boolean) => void;
    hideProgress: () => void;
  };
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  showPopup: (params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive'; text: string }> }, callback?: (buttonId: string) => void) => void;
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  hapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
}

class TelegramService {
  private webapp: TelegramWebApp | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      this.webapp = window.Telegram.WebApp;
      this.setupApp();
    } else {
      console.warn('Telegram WebApp not available - running in development mode');
    }
  }

  private setupApp() {
    if (!this.webapp) return;

    // Initialize the app
    this.webapp.ready();
    this.webapp.expand();

    // Apply theme colors to CSS variables
    this.applyTheme();

    // Setup back button
    this.setupBackButton();
  }

  private applyTheme() {
    if (!this.webapp) return;

    const { themeParams } = this.webapp;
    const root = document.documentElement;

    if (themeParams.bg_color) {
      root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color);
    }
    if (themeParams.text_color) {
      root.style.setProperty('--tg-theme-text-color', themeParams.text_color);
    }
    if (themeParams.hint_color) {
      root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color);
    }
    if (themeParams.link_color) {
      root.style.setProperty('--tg-theme-link-color', themeParams.link_color);
    }
    if (themeParams.button_color) {
      root.style.setProperty('--tg-theme-button-color', themeParams.button_color);
    }
    if (themeParams.button_text_color) {
      root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color);
    }
    if (themeParams.secondary_bg_color) {
      root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color);
    }

    // Apply dark class if needed
    if (this.webapp.colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private setupBackButton() {
    if (!this.webapp) return;

    this.webapp.BackButton.onClick(() => {
      // Handle back navigation
      if (window.history.length > 1) {
        window.history.back();
      } else {
        this.close();
      }
    });
  }

  // Public API methods
  getUser() {
    return this.webapp?.initDataUnsafe?.user || null;
  }

  getUserId(): number | null {
    return this.getUser()?.id || null;
  }

  getStartParam(): string | null {
    return this.webapp?.initDataUnsafe?.start_param || null;
  }

  isReady(): boolean {
    return !!this.webapp;
  }

  isDarkMode(): boolean {
    return this.webapp?.colorScheme === 'dark';
  }

  showMainButton(text: string, callback: () => void) {
    if (!this.webapp) return;

    this.webapp.MainButton.setText(text);
    this.webapp.MainButton.onClick(callback);
    this.webapp.MainButton.show();
  }

  hideMainButton() {
    if (!this.webapp) return;
    this.webapp.MainButton.hide();
  }

  showBackButton() {
    if (!this.webapp) return;
    this.webapp.BackButton.show();
  }

  hideBackButton() {
    if (!this.webapp) return;
    this.webapp.BackButton.hide();
  }

  showAlert(message: string): Promise<void> {
    return new Promise((resolve) => {
      if (this.webapp) {
        this.webapp.showAlert(message, () => resolve());
      } else {
        alert(message);
        resolve();
      }
    });
  }

  showConfirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.webapp) {
        this.webapp.showConfirm(message, (confirmed) => resolve(confirmed));
      } else {
        resolve(confirm(message));
      }
    });
  }

  hapticFeedback(type: 'light' | 'medium' | 'heavy' = 'light') {
    if (this.webapp?.hapticFeedback) {
      this.webapp.hapticFeedback.impactOccurred(type);
    }
  }

  hapticNotification(type: 'success' | 'warning' | 'error') {
    if (this.webapp?.hapticFeedback) {
      this.webapp.hapticFeedback.notificationOccurred(type);
    }
  }

  openTelegramLink(url: string) {
    if (this.webapp) {
      this.webapp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  }

  close() {
    if (this.webapp) {
      this.webapp.close();
    }
  }

  // Get auth data for API calls
  getAuthData() {
    if (!this.webapp) {
      return {
        initData: '',
        user: null,
        isAuthenticated: false
      };
    }

    return {
      initData: this.webapp.initData,
      user: this.getUser(),
      isAuthenticated: !!this.getUser()
    };
  }
}

// Create singleton instance
export const telegram = new TelegramService();

// Helper hook for React components
export const useTelegram = () => {
  const user = telegram.getUser();
  const isReady = telegram.isReady();
  const isDarkMode = telegram.isDarkMode();

  return {
    user,
    isReady,
    isDarkMode,
    showMainButton: telegram.showMainButton.bind(telegram),
    hideMainButton: telegram.hideMainButton.bind(telegram),
    showBackButton: telegram.showBackButton.bind(telegram),
    hideBackButton: telegram.hideBackButton.bind(telegram),
    showAlert: telegram.showAlert.bind(telegram),
    showConfirm: telegram.showConfirm.bind(telegram),
    hapticFeedback: telegram.hapticFeedback.bind(telegram),
    hapticNotification: telegram.hapticNotification.bind(telegram),
    openTelegramLink: telegram.openTelegramLink.bind(telegram),
    close: telegram.close.bind(telegram),
    getAuthData: telegram.getAuthData.bind(telegram)
  };
};

export default telegram;