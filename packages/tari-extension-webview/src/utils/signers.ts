import {
  TariPermissions,
  WalletDaemonFetchParameters,
  WalletDaemonTariSigner,
} from "@tari-project/wallet-daemon-signer";

export async function createWalletDaemonSigner(serverUrl: string) {
  const permissions = new TariPermissions().addPermission("Admin");
  const params: WalletDaemonFetchParameters = {
    permissions,
    serverUrl,
  };
  const walletDaemonProvider = await WalletDaemonTariSigner.buildFetchSigner(params);
  return walletDaemonProvider;
}
