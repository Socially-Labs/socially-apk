export type CaptainPanel = { kind: 'overview' | 'manage' | 'crew' | 'earnings' | 'create' }
  | { kind: 'vault' | 'rules' | 'exits'; id: string };
