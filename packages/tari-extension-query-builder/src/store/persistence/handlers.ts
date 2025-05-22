import { QueryBuilderState } from "../types";
import { AnyPersistedState, ValidationResult } from "./types";
import { loadStateV1, saveStateV1 } from "./v1_0";

interface VersionHandler<T extends AnyPersistedState> {
  version: T["version"];
  save: (state: QueryBuilderState) => T;
  load: (storedState: unknown) => ValidationResult<T>;
}

export const versionHandlers: Record<string, VersionHandler<AnyPersistedState>> = {
  "1.0": { version: "1.0", save: saveStateV1, load: loadStateV1 },
};

export const latestVersion = "1.0";
export const latestVersionHandler = versionHandlers[latestVersion];
