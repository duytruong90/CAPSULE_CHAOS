import { render, screen } from '@testing-library/react';
import { WinnerScreen } from '../../components/WinnerScreen/WinnerScreen';

const winner = { id: 'p1', displayName: 'Nguyễn 🎉', normalizedName: 'Nguyễn 🎉', entryIndex: 0 };

describe('official winner presentation', () => {
  it('reserves OFFICIAL WINNER while withholding verification until it succeeds', () => {
    const view = render(<WinnerScreen winner={winner} official={false} verification={null} />);
    expect(screen.getByText('OFFICIAL WINNER')).toBeInTheDocument();
    expect(screen.queryByText(/RESULT VERIFIED/)).not.toBeInTheDocument();
    view.rerender(
      <WinnerScreen
        winner={winner}
        official
        verification={{
          verified: true,
          commitmentValid: true,
          winnerValid: true,
          replayValid: true,
          errors: [],
        }}
      />,
    );
    expect(screen.getByText(/RESULT VERIFIED/)).toBeInTheDocument();
  });

  it('shows a failure instead of silently claiming verification', () => {
    render(
      <WinnerScreen
        winner={winner}
        official
        verification={{
          verified: false,
          commitmentValid: false,
          winnerValid: true,
          replayValid: true,
          errors: ['tampered'],
        }}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('VERIFICATION FAILED');
    expect(screen.queryByText(/RESULT VERIFIED/)).not.toBeInTheDocument();
  });
});
