import { StateCreator } from "zustand";
import { TariStoreAction } from "./types";

type HasSaveState = Pick<TariStoreAction, "saveState">;

export const persistStateMiddleware =
  <T extends HasSaveState>(config: StateCreator<T>): StateCreator<T> =>
  (set, get, api) =>
    config(
      (partial, replace) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
        set(partial, replace as any);
        get().saveState();
      },
      get,
      api,
    );
