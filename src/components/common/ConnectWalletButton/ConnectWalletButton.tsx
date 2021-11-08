import './ConnectWalletButton.less';

import { LoadingOutlined } from '@ant-design/icons';
import cn from 'classnames';
import React, { FC, ReactNode } from 'react';

import { Button, ButtonProps, Modal } from '../../../ergodex-cdk';
import { useObservable } from '../../../hooks/useObservable';
import {
  isWalletConnected$,
  isWalletLoading$,
} from '../../../services/new/core';
import { ChooseWalletModal } from './ChooseWalletModal/ChooseWalletModal';

export interface ConnectWalletButtonProps {
  readonly size?: ButtonProps['size'];
  readonly className?: string;
  readonly children?: ReactNode | ReactNode[] | string;
}

export const ConnectWalletButton: FC<ConnectWalletButtonProps> = ({
  size,
  className,
  children,
}) => {
  const [isWalletLoading] = useObservable(isWalletLoading$);
  const [isWalletConnected] = useObservable(isWalletConnected$);

  const openChooseWalletModal = (): void => {
    Modal.open(({ close }) => <ChooseWalletModal close={close} />, {
      width: 372,
      title: 'Select a wallet',
    });
  };

  return (
    <>
      {isWalletLoading ? (
        <Button
          size={size}
          onClick={openChooseWalletModal}
          className={cn(className, 'connect-wallet-btn')}
        >
          {isWalletConnected ? <LoadingOutlined /> : 'Connect to a wallet'}
        </Button>
      ) : (
        children
      )}
    </>
  );
};