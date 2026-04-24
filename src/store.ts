export type ClientStatus = 'Active' | 'Pending' | 'Inactive';
export interface Client { id: number; name: string; company: string; email: string; status: ClientStatus; }
export type TaskType = 'call' | 'email' | 'meeting';
export interface Task { id: number; title: string; time: string; type: TaskType; completed: boolean; }
export interface Deal { id: number; client: string; value: number; days: number; stageId: string; }
export interface PipelineStage { id: string; name: string; color: string; }

export const STATS = [
  { label: 'Total Revenue', value: '$124,500', trend: '+12.5%' },
  { label: 'Active Clients', value: '142', trend: '+5.2%' },
  { label: 'Win Rate', value: '68%', trend: '+2.1%' },
  { label: 'Avg Deal Size', value: '$8,450', trend: '-1.4%' },
];

export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'lead', name: 'Lead', color: 'bg-purple-300/20 text-purple-300 border-purple-300/30' },
  { id: 'contacted', name: 'Contacted', color: 'bg-purple-300/20 text-purple-300 border-purple-300/30' },
  { id: 'proposal', name: 'Proposal', color: 'bg-purple-300/20 text-purple-300 border-purple-300/30' },
  { id: 'won', name: 'Won', color: 'bg-indigo-300/20 text-indigo-300 border-indigo-300/30' }
];

export const INITIAL_DEALS: Deal[] = [
  { id: 1, client: 'Acme Corp', value: 12000, days: 2, stageId: 'lead' },
  { id: 2, client: 'Global Tech', value: 8000, days: 5, stageId: 'lead' },
  { id: 3, client: 'Stark Ind.', value: 45000, days: 1, stageId: 'contacted' },
  { id: 4, client: 'Wayne Ent.', value: 22000, days: 4, stageId: 'contacted' },
  { id: 5, client: 'Oscorp', value: 18000, days: 8, stageId: 'proposal' },
  { id: 6, client: 'Umbrella Corp', value: 34000, days: 0, stageId: 'won' },
  { id: 7, client: 'Cyberdyne', value: 55000, days: 0, stageId: 'won' },
];

export const INITIAL_CLIENTS: Client[] = [
  { id: 1, name: 'Eleanor Shellstrop', company: 'Good Place Inc.', email: 'eleanor@goodplace.com', status: 'Active' },
  { id: 2, name: 'Michael Scott', company: 'Dunder Mifflin', email: 'mscott@dundermifflin.com', status: 'Pending' },
  { id: 3, name: 'Leslie Knope', company: 'Pawnee Parks', email: 'leslie@pawnee.gov', status: 'Active' },
  { id: 4, name: 'Ron Swanson', company: 'Very Good Building', email: 'ron@verygood.com', status: 'Inactive' },
];

export const INITIAL_TASKS: Task[] = [
  { id: 1, title: 'Follow up with Acme Corp', time: 'Today, 2:00 PM', type: 'call', completed: false },
  { id: 2, title: 'Send proposal to Stark Ind.', time: 'Tomorrow, 10:00 AM', type: 'email', completed: false },
  { id: 3, title: 'Quarterly review with Wayne Ent.', time: 'Thu, 1:00 PM', type: 'meeting', completed: false },
];
