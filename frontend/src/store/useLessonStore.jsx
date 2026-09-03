import { create } from 'zustand';
import { temporal } from 'zundo';
import { createPageSlice } from './createPageSlice';
import { createBlockSlice } from './createBlockSlice';
import { createUISlice } from './createUISlice';
import { createCodeSyncSlice } from './createCodeSyncSlice';

export const useLessonStore = create(
  temporal(
    (...a) => ({
      ...createPageSlice(...a),
      ...createBlockSlice(...a),
      ...createUISlice(...a),
      ...createCodeSyncSlice(...a),
    }),
    {
      limit: 50,
      coolOffDuration: 1000,
      partialize: (state) => ({
        lesson: state.lesson,
        deletedBlockIds: state.deletedBlockIds,
      }),
      equality: (pastState, currentState) => {
        return pastState.lesson === currentState.lesson &&
               pastState.deletedBlockIds === currentState.deletedBlockIds;
      },
    }
  )
);

