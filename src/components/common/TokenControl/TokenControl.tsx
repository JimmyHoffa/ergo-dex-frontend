import './TokenControl.less';

import { AssetInfo } from '@ergolabs/ergo-sdk';
import { Form } from 'antd';
import cn from 'classnames';
import React, { FC, ReactNode, useEffect } from 'react';
import { of } from 'rxjs';

import { Box, Button, Flex, Typography } from '../../../ergodex-cdk';
import { useObservableAction } from '../../../hooks/useObservable';
import { getBalanceByTokenId } from '../../../services/new/balance';
import {
  TokenAmountInput,
  TokenAmountInputValue,
} from './TokenAmountInput/TokenAmountInput';
import { TokenSelect } from './TokenSelect/TokenSelect';

export interface TokenControlValue {
  amount?: TokenAmountInputValue;
  asset?: AssetInfo;
}

export interface TokenControlProps {
  readonly label?: ReactNode;
  readonly value?: TokenControlValue;
  readonly onChange?: (value: TokenControlValue) => void;
  readonly maxButton?: boolean;
  readonly assets?: AssetInfo[];
  readonly readonly?: boolean | 'asset' | 'amount';
  readonly noBottomInfo?: boolean;
  readonly bordered?: boolean;
}

const getTokenBalanceByTokenName = (tokenName: string | undefined) =>
  tokenName ? getBalanceByTokenId(tokenName) : of(undefined);

export const TokenControl: FC<TokenControlProps> = ({
  label,
  value,
  onChange,
  maxButton,
  assets,
  readonly,
  noBottomInfo,
  bordered,
}) => {
  const [balance, updateBalance] = useObservableAction(
    getTokenBalanceByTokenName,
  );

  useEffect(() => {
    if (value?.asset) {
      updateBalance(value?.asset?.id);
    } else {
      updateBalance(undefined);
    }
  }, [value, updateBalance]);

  const onAmountChange = (amount: TokenAmountInputValue) => {
    if (onChange) {
      onChange({ ...value, amount });
    }
  };

  const onTokenChange = (asset: AssetInfo) => {
    if (onChange) {
      onChange({ ...value, asset });
    }
  };

  const onMaxButtonClick = () => {
    if (onChange) {
      onChange({
        asset: value?.asset,
        amount: { value: +(balance as any), viewValue: balance?.toString() },
      });
    }
  };

  return (
    <Box
      className={cn({ 'token-control--bordered': bordered })}
      padding={4}
      borderRadius="l"
      gray
    >
      <Flex flexDirection="col">
        <Flex.Item marginBottom={2}>
          <Typography.Body type="secondary">{label}</Typography.Body>
        </Flex.Item>

        <Flex.Item marginBottom={noBottomInfo ? 0 : 2}>
          <Flex flexDirection="row">
            <Flex.Item marginRight={2} flex={1}>
              <TokenAmountInput
                readonly={!!readonly && readonly !== 'asset'}
                value={value?.amount}
                onChange={onAmountChange}
              />
            </Flex.Item>
            <Flex.Item>
              <TokenSelect
                assets={assets}
                readonly={!!readonly && readonly !== 'amount'}
                asset={value?.asset}
                onChange={onTokenChange}
              />
            </Flex.Item>
          </Flex>
        </Flex.Item>
        {!noBottomInfo && (
          <Flex
            flexDirection="row"
            alignItems="center"
            className="token-control-bottom-panel"
          >
            {balance !== undefined && (
              <Flex.Item marginRight={2}>
                <Typography.Body>
                  Balance: {balance} {value?.asset?.name}
                </Typography.Body>
              </Flex.Item>
            )}
            {balance !== undefined && maxButton && (
              <Button
                ghost
                type="primary"
                size="small"
                onClick={onMaxButtonClick}
              >
                Max
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export interface TokenControlFormItemProps {
  readonly name: string;
  readonly label: ReactNode;
  readonly maxButton?: boolean;
  readonly assets?: AssetInfo[];
  readonly readonly?: boolean | 'asset' | 'amount';
  readonly noBottomInfo?: boolean;
  readonly bordered?: boolean;
}

export const TokenControlFormItem: FC<TokenControlFormItemProps> = ({
  label,
  name,
  maxButton,
  assets,
  readonly,
  noBottomInfo,
  bordered,
}) => {
  return (
    <Form.Item name={name} className="token-form-item">
      <TokenControl
        bordered={bordered}
        noBottomInfo={noBottomInfo}
        readonly={readonly}
        assets={assets}
        maxButton={maxButton}
        label={label}
      />
    </Form.Item>
  );
};