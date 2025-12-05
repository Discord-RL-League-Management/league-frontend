import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MmrCalculationSection } from '../MmrCalculationSection.js';
import { renderWithProviders } from '../../../test/utils/test-helpers.js';
import { mmrCalculationApi } from '../../../lib/api/mmr-calculation.js';

// Mock the MMR calculation API
jest.mock('../../../lib/api/mmr-calculation', () => ({
  mmrCalculationApi: {
    calculateMmr: jest.fn(),
    testFormula: jest.fn(),
    validateFormula: jest.fn(),
  },
}));

// Mock the useMmrFormula hook
jest.mock('../../../hooks/useMmrFormula', () => ({
  useMmrFormula: jest.fn(() => ({
    testResult: null,
    validationResult: null,
    testData: {
      ones: 1200,
      twos: 1400,
      threes: 1600,
      fours: 1000,
      onesGamesPlayed: 150,
      twosGamesPlayed: 300,
      threesGamesPlayed: 500,
      foursGamesPlayed: 50,
    },
    testing: false,
    validating: false,
    validateFormula: jest.fn(),
    testFormula: jest.fn(),
    updateTestData: jest.fn(),
  })),
}));

describe('MmrCalculationSection - Calculator UI', () => {
  const mockGuildId = '123456789012345678';
  const mockMmrApi = mmrCalculationApi as jest.Mocked<typeof mmrCalculationApi>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Calculator Input Fields', () => {
    it('should render calculator input fields for all playlists', () => {
      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      // Check for all playlist labels
      expect(screen.getByText('1v1')).toBeInTheDocument();
      expect(screen.getByText('2v2')).toBeInTheDocument();
      expect(screen.getByText('3v3')).toBeInTheDocument();
      expect(screen.getByText('4v4')).toBeInTheDocument();

      // Check for MMR input placeholders
      const mmrInputs = screen.getAllByPlaceholderText('MMR');
      expect(mmrInputs).toHaveLength(4);

      // Check for games played input placeholders
      const gamesInputs = screen.getAllByPlaceholderText('Games played');
      expect(gamesInputs).toHaveLength(4);
    });

    it('should update calculator data when input values change', async () => {
      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      const mmrInputs = screen.getAllByPlaceholderText('MMR');
      const onesMmrInput = mmrInputs[0];

      fireEvent.change(onesMmrInput, { target: { value: '1500' } });

      expect(onesMmrInput).toHaveValue(1500);
    });

    it('should disable inputs when not in edit mode', () => {
      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={false} />,
      );

      const mmrInputs = screen.getAllByPlaceholderText('MMR');
      const gamesInputs = screen.getAllByPlaceholderText('Games played');

      [...mmrInputs, ...gamesInputs].forEach((input) => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('Calculate MMR Button', () => {
    it('should render calculate button', () => {
      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      expect(screen.getByText('Calculate MMR')).toBeInTheDocument();
    });

    it('should disable calculate button when not in edit mode', () => {
      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={false} />,
      );

      const calculateButton = screen.getByText('Calculate MMR');
      expect(calculateButton).toBeDisabled();
    });

    it('should call API with correct data when calculate button is clicked', async () => {
      const mockResult = {
        result: 1440,
        algorithm: 'WEIGHTED_AVERAGE' as const,
        config: {
          algorithm: 'WEIGHTED_AVERAGE' as const,
          weights: {
            ones: 0.1,
            twos: 0.3,
            threes: 0.5,
            fours: 0.1,
          },
        },
      };

      mockMmrApi.calculateMmr.mockResolvedValue(mockResult);

      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      // Fill in some test data
      const mmrInputs = screen.getAllByPlaceholderText('MMR');
      const gamesInputs = screen.getAllByPlaceholderText('Games played');

      fireEvent.change(mmrInputs[0], { target: { value: '1200' } });
      fireEvent.change(gamesInputs[0], { target: { value: '150' } });
      fireEvent.change(mmrInputs[1], { target: { value: '1400' } });
      fireEvent.change(gamesInputs[1], { target: { value: '300' } });

      // Click calculate button
      const calculateButton = screen.getByText('Calculate MMR');
      fireEvent.click(calculateButton);

      // Wait for API call
      await waitFor(() => {
        expect(mockMmrApi.calculateMmr).toHaveBeenCalledTimes(1);
      });

      // Verify API was called with correct parameters
      expect(mockMmrApi.calculateMmr).toHaveBeenCalledWith(
        mockGuildId,
        expect.objectContaining({
          ones: 1200,
          onesGamesPlayed: 150,
          twos: 1400,
          twosGamesPlayed: 300,
        }),
      );
    });

    it('should show loading state while calculating', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockMmrApi.calculateMmr.mockReturnValue(promise as any);

      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      const calculateButton = screen.getByText('Calculate MMR');
      fireEvent.click(calculateButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText('Calculating...')).toBeInTheDocument();
      });

      // Resolve the promise
      resolvePromise!({
        result: 1440,
        algorithm: 'WEIGHTED_AVERAGE' as const,
        config: {
          algorithm: 'WEIGHTED_AVERAGE' as const,
        },
      });

      await waitFor(() => {
        expect(screen.queryByText('Calculating...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Result Display', () => {
    it('should display calculated MMR result', async () => {
      const mockResult = {
        result: 1440,
        algorithm: 'WEIGHTED_AVERAGE' as const,
        config: {
          algorithm: 'WEIGHTED_AVERAGE' as const,
        },
      };

      mockMmrApi.calculateMmr.mockResolvedValue(mockResult);

      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      const calculateButton = screen.getByText('Calculate MMR');
      fireEvent.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText(/Calculated MMR: 1440/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Algorithm: WEIGHTED_AVERAGE/)).toBeInTheDocument();
    });

    it('should display error message when calculation fails', async () => {
      const mockError: any = new Error('Failed to calculate MMR');
      mockError.response = {
        data: { message: 'Invalid tracker data' },
      };

      mockMmrApi.calculateMmr.mockRejectedValue(mockError);

      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      const calculateButton = screen.getByText('Calculate MMR');
      fireEvent.click(calculateButton);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
        expect(screen.getByText(/Invalid tracker data/)).toBeInTheDocument();
      });
    });

    it('should clear previous result when calculating again', async () => {
      const mockResult = {
        result: 1440,
        algorithm: 'WEIGHTED_AVERAGE' as const,
        config: {
          algorithm: 'WEIGHTED_AVERAGE' as const,
        },
      };

      mockMmrApi.calculateMmr.mockResolvedValue(mockResult);

      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      const calculateButton = screen.getByText('Calculate MMR');

      // First calculation
      fireEvent.click(calculateButton);
      await waitFor(() => {
        expect(screen.getByText(/Calculated MMR: 1440/)).toBeInTheDocument();
      });

      // Second calculation with different result
      mockMmrApi.calculateMmr.mockResolvedValue({
        result: 1500,
        algorithm: 'WEIGHTED_AVERAGE' as const,
        config: {
          algorithm: 'WEIGHTED_AVERAGE' as const,
        },
      });

      fireEvent.click(calculateButton);
      await waitFor(() => {
        expect(screen.getByText(/Calculated MMR: 1500/)).toBeInTheDocument();
        expect(screen.queryByText(/Calculated MMR: 1440/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Calculator Section Visibility', () => {
    it('should show calculator section', () => {
      renderWithProviders(
        <MmrCalculationSection guildId={mockGuildId} isEditMode={true} />,
      );

      expect(screen.getByText('MMR Calculator')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Enter tracker data to calculate MMR using the configured algorithm/,
        ),
      ).toBeInTheDocument();
    });
  });
});

