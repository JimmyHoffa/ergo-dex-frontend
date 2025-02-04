import {
  catchError,
  combineLatest,
  first,
  map,
  Observable,
  of,
  publishReplay,
  refCount,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { notification } from '../../../ergodex-cdk';
import { Wallet, WalletState } from '../../common';
import { walletSettings } from '../settings/walletSettings';
import { Nautilus } from './nautilus';
import { Yoroi } from './yoroi';

const updateSelectedWallet$ = new Subject<string | undefined>();

export const wallets$ = of([Nautilus, Yoroi]);

export const disconnectWallet = (): void => {
  selectedWallet$.pipe(first()).subscribe((wallet) => {
    if (wallet?.onDisconnect) {
      wallet.onDisconnect();
    }
    walletSettings.removeConnected();
    location.reload();
  });
};

export const connectWallet = (wallet: Wallet): Observable<any> => {
  const connectedWalletName = walletSettings.getConnected();
  walletSettings.removeConnected();

  if (connectedWalletName) {
    return combineLatest([wallet.connectWallet(), selectedWallet$]).pipe(
      tap(([isConnected, selectedWallet]) => {
        if (!isConnected || !(typeof isConnected === 'boolean')) {
          return;
        }

        if (selectedWallet?.onDisconnect) {
          selectedWallet.onDisconnect();
        }
        walletSettings.setConnected(wallet.name);
        location.reload();
      }),
      map(([isConnected]) => isConnected),
    );
  }

  updateSelectedWallet$.next(undefined);
  return wallet.connectWallet().pipe(
    tap((isConnected) => {
      if (isConnected && typeof isConnected === 'boolean') {
        walletSettings.setConnected(wallet.name);
        updateSelectedWallet$.next(wallet.name);
      }
    }),
  );
};

export const selectedWallet$: Observable<Wallet | undefined> =
  updateSelectedWallet$.pipe(
    startWith(walletSettings.getConnected()),
    switchMap((walletName: string | undefined) => {
      if (!walletName) {
        return of(undefined);
      }
      return wallets$.pipe(
        map((wallets) => wallets.find((w) => w.name === walletName)),
      );
    }),
    tap((wallet) => {
      if (!wallet?.getNotification) {
        return;
      }

      const notificationArgs = wallet.getNotification();
      if (notificationArgs) {
        notification.info(notificationArgs);
      }
    }),
    publishReplay(1),
    refCount(),
  );

export const selectedWalletState$: Observable<WalletState> =
  selectedWallet$.pipe(
    switchMap((wallet) => {
      if (!wallet) {
        return of(WalletState.NOT_CONNECTED);
      }

      try {
        return wallet.connectWallet().pipe(
          map((isConnected) =>
            typeof isConnected === 'boolean' && isConnected
              ? WalletState.CONNECTED
              : WalletState.NOT_CONNECTED,
          ),
          startWith(WalletState.CONNECTING),
          catchError(() => of(WalletState.NOT_CONNECTED)),
        );
      } catch {
        return of(WalletState.NOT_CONNECTED);
      }
    }),
    publishReplay(1),
    refCount(),
  );
