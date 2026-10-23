import React from 'react';
import { AppState } from '../../types';
import { RiderDispatchView } from '../views/RiderDispatchView';

interface Props {
  state: AppState;
}

export const RiderDashboard: React.FC<Props> = ({ state }) => {
  return (
    <div className="space-y-6">
      <RiderDispatchView
        tasks={state.tasks}
        riders={state.riders}
        activeRiderId="rider-1-rohan"
      />
    </div>
  );
};
