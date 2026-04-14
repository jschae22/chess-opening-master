import { Opening } from '../constants/openings';

interface ApiOpening {
  id: number;
  name: string;
  description: string;
  side: 'WHITE' | 'BLACK';
  moves: string[];
}

export async function fetchOpenings(): Promise<Opening[]> {
  const response = await fetch('/api/openings');
  if (!response.ok) {
    throw new Error(`Failed to fetch openings: ${response.status}`);
  }
  const data: ApiOpening[] = await response.json();
  return data.map(o => ({
    name: o.name,
    description: o.description,
    side: o.side.toLowerCase() as 'white' | 'black',
    moves: o.moves,
  }));
}
