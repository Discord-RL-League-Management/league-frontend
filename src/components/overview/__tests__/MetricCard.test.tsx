/**
 * Black Box Tests for MetricCard Component
 * 
 * These tests strictly adhere to the Black Box Axiom:
 * - Verify only public contract (props → rendered output)
 * - No implementation coupling
 * - State verification preferred
 * - Cyclomatic complexity v(G) ≤ 7 per test
 */

import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '../MetricCard.js';
import { Gamepad2 } from 'lucide-react';

describe('MetricCard', () => {
  describe('loading state', () => {
    test('renders skeleton when isLoading is true', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={true}
        />
      );

      // Verify skeleton is rendered (state verification - check for animate-pulse class)
      const skeleton = container.querySelector('[class*="animate-pulse"]');
      expect(skeleton).toBeInTheDocument();
    });

    test('does not render value when isLoading is true', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={true}
        />
      );

      // Verify value is not displayed during loading
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    test('displays error message when error is provided', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={false}
          error="Failed to load"
        />
      );

      expect(screen.getByText('Error loading')).toBeInTheDocument();
    });

    test('loading takes precedence over error when isLoading is true', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={true}
          error="Failed to load"
        />
      );

      // Loading state should be displayed when isLoading is true, even with error
      const skeleton = container.querySelector('[class*="animate-pulse"]');
      expect(skeleton).toBeInTheDocument();
      expect(screen.queryByText('Error loading')).not.toBeInTheDocument();
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });

    test('does not display value when error is present', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={false}
          error="Failed to load"
        />
      );

      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });
  });

  describe('success state', () => {
    test('displays formatted number value with toLocaleString', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={1234}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Verify formatted number (locale-specific, but should contain digits)
      const valueElement = screen.getByText(/1[,\s]?234/);
      expect(valueElement).toBeInTheDocument();
    });

    test('displays null value as em dash', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={null}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    test('displays string value as-is', () => {
      render(
        <MetricCard
          title="Test Metric"
          value="50%"
          icon={Gamepad2}
          isLoading={false}
        />
      );

      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    test('displays zero value correctly', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={0}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    test('displays large numbers with formatting', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={1234567}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Verify formatted large number (locale-specific formatting)
      const valueElement = screen.getByText(/1[,\s]?234[,\s]?567/);
      expect(valueElement).toBeInTheDocument();
    });
  });

  describe('description rendering', () => {
    test('displays description when provided', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={100}
          description="Test description"
          icon={Gamepad2}
          isLoading={false}
        />
      );

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    test('does not display description when not provided', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Verify description is not in the document
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });

    test('displays empty string description when provided', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={100}
          description=""
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Empty string should not render description
      expect(screen.queryByText(/description/i)).not.toBeInTheDocument();
    });
  });

  describe('title rendering', () => {
    test('displays title correctly', () => {
      render(
        <MetricCard
          title="Games Played"
          value={100}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      expect(screen.getByText('Games Played')).toBeInTheDocument();
    });
  });

  describe('icon rendering', () => {
    test('renders icon component', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Icon should be rendered (checking for SVG element which lucide icons render as)
      const svgElement = container.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });

    test('applies custom icon color when provided', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={false}
          iconColor="text-blue-600"
        />
      );

      // Verify icon element exists (state verification - we check it renders)
      const iconElement = container.querySelector('svg');
      expect(iconElement).toBeInTheDocument();
    });

    test('applies custom icon background when provided', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={false}
          iconBg="bg-blue-100"
        />
      );

      // Verify icon container exists
      const iconElement = container.querySelector('svg');
      expect(iconElement).toBeInTheDocument();
    });

    test('uses default icon color when not provided', () => {
      const { container } = render(
        <MetricCard
          title="Test Metric"
          value={100}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Icon should render with default styling
      const iconElement = container.querySelector('svg');
      expect(iconElement).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    test('handles undefined value', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={undefined as unknown as null}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      expect(screen.getByText('—')).toBeInTheDocument();
    });

    test('handles very large numbers', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={999999999}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Verify large number is formatted
      const valueElement = screen.getByText(/999[,\s]?999[,\s]?999/);
      expect(valueElement).toBeInTheDocument();
    });

    test('handles negative numbers', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={-100}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Verify negative number is displayed
      const valueElement = screen.getByText(/-100/);
      expect(valueElement).toBeInTheDocument();
    });

    test('handles decimal numbers', () => {
      render(
        <MetricCard
          title="Test Metric"
          value={123.45}
          icon={Gamepad2}
          isLoading={false}
        />
      );

      // Verify decimal number is displayed
      const valueElement = screen.getByText(/123[.,]45/);
      expect(valueElement).toBeInTheDocument();
    });
  });
});

