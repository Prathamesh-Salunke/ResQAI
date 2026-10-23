import React from 'react';
import { AppState } from '../../types';
import { ShelterDemandView } from '../views/ShelterDemandView';

interface Props {
  state: AppState;
}

export const ShelterDashboard: React.FC<Props> = ({ state }) => {
  return (
    <div className="space-y-6">
      <ShelterDemandView
        shelters={state.shelters}
        demands={state.demands}
        tasks={state.tasks}
      />
    </div>
  );
};
