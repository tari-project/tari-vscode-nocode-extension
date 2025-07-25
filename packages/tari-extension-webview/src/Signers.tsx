import {
  VscodeButton,
  VscodeCollapsible,
  VscodeFormGroup,
  VscodeFormHelper,
  VscodeLabel,
  VscodeTabHeader,
  VscodeTabPanel,
  VscodeTabs,
  VscodeTextfield,
} from "@vscode-elements/react-elements";
import * as ve from "@vscode-elements/elements";
import { useTariStore } from "./store/tari-store";
import { WalletConnectTariSigner } from "@tari-project/wallet-connect-signer";
import { TariConfiguration, TariProviderType } from "@tari-project/tari-extension-common";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCollapsibleToggle } from "./hooks/collapsible-toggle";
import { useEnterKey } from "./hooks/textfield-enter";
import { DEFAULT_TARI_PROJECT_ID, DEFAULT_WALLET_DAEMON_ADDRESS } from "./constants";
import { createWalletDaemonSigner } from "./utils/signers";
import { TariSigner } from "@tari-project/tarijs-all";

const PROVIDERS = [TariProviderType.WalletDemon, TariProviderType.WalletConnect];

interface SignersProps {
  configuration: TariConfiguration;
  open?: boolean;
  onToggle?: (open: boolean) => void;
}

function Signers({ configuration, open, onToggle }: SignersProps) {
  const messenger = useTariStore((state) => state.messenger);
  const provider = useTariStore((state) => state.signer);
  const setSigner = useTariStore((state) => state.setSigner);
  const setWalletInfo = useTariStore((state) => state.setWalletInfo);
  const setAccounts = useTariStore((state) => state.setAccounts);
  const getNetworkName = useTariStore((state) => state.getNetworkName);

  const [selectedProviderIndex, setSelectedProviderIndex] = useState<number>(
    PROVIDERS.indexOf(configuration.defaultProvider),
  );
  const [walletDaemonAddress, setWalletDaemonAddress] = useState<string>(configuration.walletDaemonAddress ?? "");
  const walletDaemonAddressRef = useRef<ve.VscodeTextfield>(null);
  const [walletConnectProjectId, setWalletConnectProjectId] = useState<string>(
    configuration.walletConnectProjectId ?? "",
  );
  const walletConnectProjectIdRef = useRef<ve.VscodeTextfield>(null);
  const [connecting, setConnecting] = useState<boolean>(false);

  const collapsibleRef = useCollapsibleToggle(onToggle ?? (() => undefined));

  const updateStoreOnConnect = useCallback(
    async (signer: TariSigner) => {
      setSigner(signer);
      const walletInfo = await signer.getWalletInfo();
      setWalletInfo(walletInfo);
      const accounts = await signer.accountsList({ offset: 0, limit: 100 });
      setAccounts(accounts);
    },
    [setWalletInfo, setAccounts, setSigner],
  );

  useEffect(() => {
    const network = getNetworkName();
    if (messenger && network) {
      messenger.send("setNetwork", network).catch(console.log);
    }
  }, [messenger, getNetworkName]);

  const handleDisconnect = () => {
    setWalletInfo(undefined);
    setAccounts(undefined);
    setSigner(undefined);
  };

  const handleWalletDaemonConnect = useCallback(async () => {
    const walletDaemonProvider = await createWalletDaemonSigner(walletDaemonAddress || DEFAULT_WALLET_DAEMON_ADDRESS);
    await updateStoreOnConnect(walletDaemonProvider);
  }, [updateStoreOnConnect, walletDaemonAddress]);

  const handleWalletConnectConnect = useCallback(async () => {
    const params = {
      projectId: walletConnectProjectId || DEFAULT_TARI_PROJECT_ID,
      requiredPermissions: ["Admin"],
      optionalPermissions: [],
    };
    const walletConnectProvider = new WalletConnectTariSigner(params);
    await walletConnectProvider.connect();
    await updateStoreOnConnect(walletConnectProvider);
  }, [updateStoreOnConnect, walletConnectProjectId]);

  const handleConnect = useCallback(async () => {
    if (messenger) {
      setConnecting(true);
      const longOperation = messenger.send("showLongOperation", { title: "Connecting", cancellable: true });
      try {
        const selectedProvider = PROVIDERS[selectedProviderIndex];
        switch (selectedProvider) {
          case TariProviderType.WalletDemon:
            await handleWalletDaemonConnect();
            await messenger.send("setWalletDaemonAddress", walletDaemonAddress);
            break;
          case TariProviderType.WalletConnect: {
            await messenger.send("updateLongOperation", { increment: 30, message: "Connecting to WalletConnect" });
            const result = await Promise.race([handleWalletConnectConnect(), longOperation]);
            const cancelled = result?.cancelled;
            if (!cancelled) {
              await messenger.send("setWalletConnectProjectId", walletConnectProjectId);
            }
            break;
          }
        }
        await messenger.send("setDefaultProvider", selectedProvider);
      } catch (error: unknown) {
        await messenger.send("showError", { message: "Failed to connect", detail: String(error) });
      }

      await messenger.send("endLongOperation", undefined);
      await longOperation;
      setConnecting(false);
    }
  }, [
    messenger,
    selectedProviderIndex,
    walletDaemonAddress,
    walletConnectProjectId,
    handleWalletConnectConnect,
    handleWalletDaemonConnect,
  ]);

  const handleEnterPressed = useCallback(() => {
    handleConnect().catch(console.log);
  }, [handleConnect]);

  useEnterKey(walletDaemonAddressRef, handleEnterPressed);
  useEnterKey(walletConnectProjectIdRef, handleEnterPressed);

  return (
    <>
      <VscodeCollapsible ref={collapsibleRef} title="Connection" open={open ?? true}>
        <VscodeTabs
          selectedIndex={selectedProviderIndex}
          onVscTabsSelect={(event) => {
            setSelectedProviderIndex(event.detail.selectedIndex);
          }}
        >
          <VscodeTabHeader slot="header">Wallet Daemon</VscodeTabHeader>
          <VscodeTabPanel>
            <VscodeFormGroup>
              <VscodeLabel htmlFor="walletDaemonAddress">JSON RPC address</VscodeLabel>
              <VscodeTextfield
                ref={walletDaemonAddressRef}
                id="walletDaemonAddress"
                value={walletDaemonAddress}
                onInput={(event) => {
                  const target = event.target as ve.VscodeTextfield;
                  setWalletDaemonAddress(target.value);
                }}
              />
              <VscodeFormHelper>
                Empty to defaults to <code>{DEFAULT_WALLET_DAEMON_ADDRESS}</code>
              </VscodeFormHelper>
            </VscodeFormGroup>
          </VscodeTabPanel>
          <VscodeTabHeader slot="header">WalletConnect</VscodeTabHeader>
          <VscodeTabPanel>
            <VscodeFormGroup>
              <VscodeLabel htmlFor="walletConnectProjectId">Project ID</VscodeLabel>
              <VscodeTextfield
                ref={walletConnectProjectIdRef}
                id="walletConnectProjectId"
                value={walletConnectProjectId}
                onInput={(event) => {
                  const target = event.target as ve.VscodeTextfield;
                  setWalletConnectProjectId(target.value);
                }}
              />
              <VscodeFormHelper>
                Empty defaults to Tari project ID. You will need to reconnect, if you switch away from Tari extension.
              </VscodeFormHelper>
            </VscodeFormGroup>
          </VscodeTabPanel>
        </VscodeTabs>

        <VscodeButton
          icon="vm-connect"
          disabled={!!provider || connecting}
          onClick={() => {
            void handleConnect();
          }}
        >
          Connect
        </VscodeButton>
        <VscodeButton
          icon="debug-disconnect"
          disabled={!provider}
          style={{ marginLeft: "8px" }}
          onClick={handleDisconnect}
        >
          Disconnect
        </VscodeButton>
      </VscodeCollapsible>
    </>
  );
}

export default Signers;
