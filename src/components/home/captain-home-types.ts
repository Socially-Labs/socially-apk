export type CaptainPanel = { kind: 'overview' | 'manage' | 'crew' | 'earnings' | 'create' | 'notifications' }
  | { kind: 'vault' | 'rules' | 'exits'; id: string };
