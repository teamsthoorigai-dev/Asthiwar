import type { EstimateFormState } from './types';

export * from './types';
export * from './schema';

export const INITIAL_FORM_STATE: EstimateFormState = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  plotLocation: '',
  plotArea: 2400,
  plotAreaUnit: 'sqft',
  builtupAreaPerFloor: 1500,
  builtupAreaUnit: 'sqft',
  carParkingAreaSqft: 200,
  carCount: 1,

  isVariableArea: false,
  floorBreakdown: [1500],
  headRoomAreaSqft: 0,

  floorCount: 0,
  packageSlug: 'standard',
  customizations: [],
  addons: [],
};
