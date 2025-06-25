import { ExecuteTransactionBaseRequest, ShowGeneratedCodeRequest, TransactionProps } from "@tari-project/tari-extension-common";

export interface FlowToTariView {
  getTransactionProps: () => Promise<TransactionProps>;
  executeTransaction: (request: ExecuteTransactionBaseRequest) => Promise<void>;
  showGeneratedCode: (request: ShowGeneratedCodeRequest) => Promise<void>;
}
