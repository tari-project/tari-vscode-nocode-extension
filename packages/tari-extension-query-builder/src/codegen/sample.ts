import {
  Amount,
  buildTransactionRequest,
  Network,
  submitAndWaitForTransaction,
  TariSigner,
  TransactionBuilder,
} from "@tari-project/tarijs-all";
import { TransactionResult, UnsignedTransactionV1 } from "@tari-project/typescript-bindings";

function buildTransaction(network: Network): UnsignedTransactionV1 {
  const builder = new TransactionBuilder(network);
  builder.feeTransactionPayFromComponent("ACCOUNT_ADDRESS", Amount.of(12345));
  builder.callMethod(
    {
      componentAddress: "COMPONENT_ADDRESS",
      methodName: "method_name",
    },
    ["a1", 2, { Workspace: "a2" }],
  );
  builder.saveVar("b3");
  builder.callFunction(
    {
      templateAddress: "TEMPLATE_ADDRESS",
      functionName: "function_name",
    },
    ["b2", 3, { Workspace: "b3" }],
  );
  builder.addInstruction({
    EmitLog: {
      level: "Info",
      message: "Hello, world!",
    },
  });
  return builder.buildUnsignedTransaction();
}

export async function executeTransaction(
  signer: TariSigner,
  network: Network,
  accountId: number,
): Promise<TransactionResult> {
  const submitTransactionRequest = buildTransactionRequest(buildTransaction(network), accountId);

  const txResult = await submitAndWaitForTransaction(signer, submitTransactionRequest);
  return txResult.result.result;
}
