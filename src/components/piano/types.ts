
export interface Note {
  name: string;
  frequency: number;
  isSharp: boolean;
}

export type InstrumentType = 'grand-piano' | 'upright-piano' | 'epiano' | 'organ' | 'clavinet' | 'synth';

export interface InstrumentConfig {
  name: string;
}

export const instruments: Record<InstrumentType, InstrumentConfig> = {
  'grand-piano': {
    name: 'Grand Piano'
  },
  'upright-piano': {
    name: 'Upright Piano'
  },
  'epiano': {
    name: 'Electric Piano'
  },
  'organ': {
    name: 'Organ'
  },
  'clavinet': {
    name: 'Clavinet'
  },
  'synth': {
    name: 'Synth'
  }
};
