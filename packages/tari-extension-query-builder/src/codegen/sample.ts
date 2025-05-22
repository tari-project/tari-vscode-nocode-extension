import {
  buildTransactionRequest,
  fromWorkspace,
  Network,
  ReqSubstate,
  submitAndWaitForTransaction,
  SubmitTxResult,
  TariSigner,
  Transaction,
  TransactionBuilder,
} from "@tari-project/tarijs-all";

function buildTransaction(): Transaction {
  const builder = new TransactionBuilder();
  builder.feeTransactionPayFromComponent("ACCOUNT_ADDRESS", "12345");
  builder.callMethod(
    {
      componentAddress: "COMPONENT_ADDRESS",
      methodName: "method_name",
    },
    ["a1", 2, fromWorkspace("a2")],
  );
  builder.saveVar("b3");
  builder.callFunction(
    {
      templateAddress: "TEMPLATE_ADDRESS",
      functionName: "function_name",
    },
    ["b2", 3, fromWorkspace("b3")],
  );
  builder.addInstruction({
    EmitLog: {
      level: "Info",
      message: "Hello, world!",
    },
  });
  return builder.build();
}

export async function executeTransaction(
  signer: TariSigner,
  network: Network,
  accountId: number,
  requiredSubstates: ReqSubstate[] = [],
  isDryRun = false,
): Promise<SubmitTxResult> {
  const submitTransactionRequest = buildTransactionRequest(
    buildTransaction(),
    accountId,
    requiredSubstates,
    undefined,
    isDryRun,
    network,
  );

  const txResult = await submitAndWaitForTransaction(signer, submitTransactionRequest);
  return txResult;
}
