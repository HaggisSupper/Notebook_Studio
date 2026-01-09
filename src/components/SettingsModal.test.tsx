import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsModal from './SettingsModal';
import * as encryption from '../utils/encryption';

// Mock the encryption module
vi.mock('../utils/encryption', () => ({
  storeApiKey: vi.fn(),
  getApiKey: vi.fn(),
  removeApiKey: vi.fn(),
}));

describe('SettingsModal', () => {
  const mockSettings = {
    provider: 'google' as const,
    model: 'gemini-2.0-flash-exp',
    apiKey: 'test-api-key',
    searchConfig: {
      provider: 'simulated' as const,
      apiKey: 'test-search-key',
    },
  };

  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the settings modal', () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('System Configuration')).toBeInTheDocument();
  });

  it('should display provider selection buttons', () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('google')).toBeInTheDocument();
    expect(screen.getByText('openrouter')).toBeInTheDocument();
    expect(screen.getByText('local')).toBeInTheDocument();
  });

  it('should show encryption indicator for API key field', () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    // Check for the lock emoji indicating encryption
    const apiKeyLabels = screen.getAllByText(/API Key/i);
    expect(apiKeyLabels.length).toBeGreaterThan(0);
    
    // Check for encryption indicator (🔒)
    const encryptionIndicators = screen.getAllByText(/🔒/);
    expect(encryptionIndicators.length).toBeGreaterThan(0);
  });

  it('should call storeApiKey when saving with API key', async () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save System Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(encryption.storeApiKey).toHaveBeenCalledWith(
        'google_api_key',
        'test-api-key'
      );
    });
  });

  it('should call storeApiKey for search API key when saving', async () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save System Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(encryption.storeApiKey).toHaveBeenCalledWith(
        'search_api_key',
        'test-search-key'
      );
    });
  });

  it('should not call storeApiKey when API key is empty', async () => {
    const settingsWithoutKey = {
      ...mockSettings,
      apiKey: '',
    };

    render(
      <SettingsModal
        settings={settingsWithoutKey}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save System Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });

    // Should not store empty key
    expect(encryption.storeApiKey).not.toHaveBeenCalledWith(
      'google_api_key',
      ''
    );
  });

  it('should call onSave callback with updated settings', async () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save System Configuration');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        provider: 'google',
        model: 'gemini-2.0-flash-exp',
      }));
    });
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // SVG button
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should update provider when provider button is clicked', () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const openrouterButton = screen.getByText('openrouter');
    fireEvent.click(openrouterButton);

    // Save to verify the provider changed
    const saveButton = screen.getByText('Save System Configuration');
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'openrouter',
    }));
  });

  it('should show base URL input for non-google providers', () => {
    const localSettings = {
      ...mockSettings,
      provider: 'local' as const,
    };

    render(
      <SettingsModal
        settings={localSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Base URL')).toBeInTheDocument();
  });

  it('should not show base URL input for google provider', () => {
    render(
      <SettingsModal
        settings={mockSettings}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Base URL')).not.toBeInTheDocument();
  });

  it('should handle missing search config gracefully', async () => {
    const settingsWithoutSearchConfig = {
      ...mockSettings,
      searchConfig: {
        provider: 'simulated' as const,
        apiKey: undefined,
      },
    };

    render(
      <SettingsModal
        settings={settingsWithoutSearchConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const saveButton = screen.getByText('Save System Configuration');
    fireEvent.click(saveButton);

    // Should not throw error
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});
