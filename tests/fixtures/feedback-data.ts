// Literal acceptance examples shared by API and UI coverage; do not derive from the validator.
export const emailVariants = [
  { id: 'EMAIL-01', email: '  player@example.com  ', accepted: true, stored: 'player@example.com' },
  { id: 'EMAIL-02', email: 'Player09.first_qa+tag-test@example.com', accepted: true, stored: 'Player09.first_qa+tag-test@example.com' },
  { id: 'EMAIL-03', email: 'player@games-2.example.com', accepted: true, stored: 'player@games-2.example.com' },
  { id: 'EMAIL-04', email: 'player@example.co', accepted: true, stored: 'player@example.co' },
  { id: 'EMAIL-05', email: 'player@example.COM', accepted: true, stored: 'player@example.COM' },
  ...[
    ['EMAIL-06', '@example.com'], ['EMAIL-07', '.player@example.com'], ['EMAIL-08', 'player.@example.com'],
    ['EMAIL-09', 'play..er@example.com'], ['EMAIL-10', 'player!qa@example.com'], ['EMAIL-11', 'pláyer@example.com'],
    ['EMAIL-12', 'player name@example.com'], ['EMAIL-13', 'player.example.com'], ['EMAIL-14', 'player@@example.com'],
    ['EMAIL-15', 'player@'], ['EMAIL-16', 'player@example'], ['EMAIL-17', 'player@.example.com'],
    ['EMAIL-18', 'player@example..com'], ['EMAIL-19', 'player@example.com.'], ['EMAIL-20', 'player@-example.com'],
    ['EMAIL-21', 'player@example-.com'], ['EMAIL-22', 'player@exam_ple.com'], ['EMAIL-23', 'player@exámple.com'],
    ['EMAIL-24', 'player@ example.com'], ['EMAIL-25', 'player@example.c'], ['EMAIL-26', 'player@example.c0m'],
    ['EMAIL-27', 'player@example.co-m'],
  ].map(([id, email]) => ({ id: id!, email: email!, accepted: false, stored: undefined })),
] as const;

export const descriptionBoundaries = [
  { id: 'ASCII-19', description: '1234567890123456789', accepted: false },
  { id: 'ASCII-20-TRIM', description: '  12345678901234567890  ', accepted: true, stored: '12345678901234567890' },
  { id: 'EMOJI-19', description: '🎮'.repeat(19), accepted: false },
  { id: 'EMOJI-20-TRIM', description: '  ' + '🎮'.repeat(20) + '  ', accepted: true, stored: '🎮'.repeat(20) },
  { id: 'EMPTY', description: ' \t\n ', accepted: false },
] as const;
