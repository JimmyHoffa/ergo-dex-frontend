import { AssetInfo } from '@ergolabs/ergo-sdk/build/main/entities/assetInfo';
import { maxBy } from 'lodash';
import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  Observable,
  of,
  skip,
  switchMap,
} from 'rxjs';

import { getAmmPoolsByAssetPair } from '../../api/ammPools';
import { useAssetsBalance } from '../../api/assetBalance';
import { getAvailableAssetFor, tokenAssets$ } from '../../api/assets';
import { useSubscription } from '../../common/hooks/useObservable';
import { AmmPool } from '../../common/models/AmmPool';
import { Currency } from '../../common/models/Currency';
import {
  END_TIMER_DATE,
  LOCKED_TOKEN_ID,
} from '../../components/common/ActionForm/ActionButton/ActionButton';
import { ActionForm } from '../../components/common/ActionForm/ActionForm';
import { TokenControlFormItem } from '../../components/common/TokenControl/TokenControl';
import {
  openConfirmationModal,
  Operation,
} from '../../components/ConfirmationModal/ConfirmationModal';
import { Page } from '../../components/Page/Page';
import {
  Flex,
  Form,
  SwapOutlined,
  Typography,
  useForm,
} from '../../ergodex-cdk';
import { useMaxTotalFees, useNetworkAsset } from '../../services/new/core';
import { OperationSettings } from './OperationSettings/OperationSettings';
import { PoolSelector } from './PoolSelector/PoolSelector';
import { SwapConfirmationModal } from './SwapConfirmationModal/SwapConfirmationModal';
import { SwapFormModel } from './SwapFormModel';
import { SwapInfo } from './SwapInfo/SwapInfo';
import { SwitchButton } from './SwitchButton/SwitchButton';

const getToAssets = (fromAsset?: string) =>
  fromAsset ? getAvailableAssetFor(fromAsset) : tokenAssets$;

const isAssetsPairEquals = (
  [prevFrom, prevTo]: [AssetInfo | undefined, AssetInfo | undefined],
  [nextFrom, nextTo]: [AssetInfo | undefined, AssetInfo | undefined],
) =>
  (prevFrom?.id === nextFrom?.id && prevTo?.id === nextTo?.id) ||
  (prevFrom?.id === nextTo?.id && prevTo?.id === nextFrom?.id);

const getAvailablePools = (xId?: string, yId?: string): Observable<AmmPool[]> =>
  xId && yId ? getAmmPoolsByAssetPair(xId, yId) : of([]);

export const Swap = (): JSX.Element => {
  const form = useForm<SwapFormModel>({
    fromAmount: undefined,
    toAmount: undefined,
    fromAsset: undefined,
    toAsset: undefined,
    pool: undefined,
  });
  const [lastEditedField, setLastEditedField] = useState<'from' | 'to'>('from');
  const networkAsset = useNetworkAsset();
  const [balance] = useAssetsBalance();
  const totalFees = useMaxTotalFees();
  const updateToAssets$ = useMemo(
    () => new BehaviorSubject<string | undefined>(undefined),
    [],
  );
  const toAssets$ = useMemo(
    () => updateToAssets$.pipe(switchMap(getToAssets)),
    [],
  );

  useEffect(() => form.patchValue({ fromAsset: networkAsset }), [networkAsset]);

  const getInsufficientTokenNameForFee = ({
    fromAmount,
  }: Required<SwapFormModel>) => {
    const totalFeesWithAmount = fromAmount.isAssetEquals(networkAsset)
      ? fromAmount.plus(totalFees)
      : totalFees;

    return totalFeesWithAmount.gt(balance.get(networkAsset))
      ? networkAsset.name
      : undefined;
  };

  const getInsufficientTokenNameForTx = ({
    fromAsset,
    fromAmount,
  }: SwapFormModel) => {
    if (fromAsset && fromAmount && fromAmount.gt(balance.get(fromAsset))) {
      return fromAsset.name;
    }
    return undefined;
  };

  const isAmountNotEntered = ({ toAmount, fromAmount }: SwapFormModel) => {
    if (
      (!fromAmount?.isPositive() && toAmount?.isPositive()) ||
      (!toAmount?.isPositive() && fromAmount?.isPositive())
    ) {
      return false;
    }

    return !fromAmount?.isPositive() || !toAmount?.isPositive();
  };

  const getMinValueForToken = ({
    toAmount,
    fromAmount,
    fromAsset,
    toAsset,
    pool,
  }: SwapFormModel): Currency | undefined => {
    if (
      !fromAmount?.isPositive() &&
      toAmount &&
      toAmount.isPositive() &&
      pool &&
      toAmount.gt(pool.getAssetAmount(toAmount.asset))
    ) {
      return undefined;
    }

    if (!fromAmount?.isPositive() && toAmount?.isPositive() && pool) {
      // TODO: FIX_ERGOLABS_SDK_COMPUTING
      return pool.calculateOutputAmount(new Currency(1n, fromAsset)).plus(1n);
    }
    if (!toAmount?.isPositive() && fromAmount?.isPositive() && pool) {
      return pool.calculateInputAmount(new Currency(1n, toAsset));
    }
    return undefined;
  };

  const isTokensNotSelected = ({ toAsset, fromAsset }: SwapFormModel) =>
    !toAsset || !fromAsset;

  const isSwapLocked = ({ toAsset, fromAsset }: SwapFormModel) =>
    (toAsset?.id === LOCKED_TOKEN_ID || fromAsset?.id === LOCKED_TOKEN_ID) &&
    DateTime.now().toUTC().toMillis() < END_TIMER_DATE.toMillis();

  const isPoolLoading = ({ fromAsset, toAsset, pool }: SwapFormModel) =>
    !!fromAsset && !!toAsset && !pool;

  const submitSwap = (value: Required<SwapFormModel>) => {
    openConfirmationModal(
      (next) => {
        return (
          <SwapConfirmationModal
            value={value}
            onClose={(request: Promise<any>) =>
              next(
                request.then((tx) => {
                  resetForm();
                  return tx;
                }),
              )
            }
          />
        );
      },
      Operation.SWAP,
      {
        xAsset: value.fromAmount!,
        yAsset: value.toAmount!,
      },
    );
  };

  const resetForm = () =>
    form.patchValue(
      { fromAmount: undefined, toAmount: undefined },
      { emitEvent: 'silent' },
    );

  const handleMaxButtonClick = (balance: Currency) =>
    balance.asset.id === networkAsset.id ? balance.minus(totalFees) : balance;

  const isLiquidityInsufficient = ({ toAmount, pool }: SwapFormModel) => {
    if (!toAmount?.isPositive() || !pool) {
      return false;
    }
    return toAmount?.gt(pool.getAssetAmount(toAmount?.asset));
  };

  useSubscription(form.controls.fromAsset.valueChangesWithSilent$, (token) =>
    updateToAssets$.next(token?.id),
  );

  useSubscription(
    combineLatest([
      form.controls.fromAsset.valueChangesWithSilent$.pipe(
        distinctUntilChanged(),
      ),
      form.controls.toAsset.valueChangesWithSilent$.pipe(
        distinctUntilChanged(),
      ),
    ]).pipe(
      debounceTime(100),
      distinctUntilChanged(isAssetsPairEquals),
      switchMap(([fromAsset, toAsset]) =>
        getAvailablePools(fromAsset?.id, toAsset?.id),
      ),
    ),
    (pools) => {
      if (!pools.length && form.value.toAsset && form.value.fromAsset) {
        form.patchValue(
          {
            pool: undefined,
            toAsset: undefined,
            toAmount:
              lastEditedField === 'to' ? form.value.toAmount : undefined,
            fromAmount:
              lastEditedField === 'from' ? form.value.fromAmount : undefined,
          },
          { emitEvent: 'silent' },
        );
        return;
      }

      const newPool =
        pools.find((p) => p.id === form.value.pool?.id) ||
        maxBy(pools, (p) => p.x.amount * p.y.amount);

      form.patchValue({ pool: newPool });
    },
    [lastEditedField],
  );

  useSubscription(
    form.controls.fromAmount.valueChanges$.pipe(skip(1)),
    (value) => {
      setLastEditedField('from');

      if (form.value.pool && value) {
        form.controls.toAmount.patchValue(
          form.value.pool.calculateOutputAmount(value),
          { emitEvent: 'silent' },
        );
      } else {
        form.controls.toAmount.patchValue(undefined, { emitEvent: 'silent' });
      }
    },
  );

  useSubscription(
    form.controls.toAmount.valueChanges$.pipe(skip(1)),
    (value) => {
      setLastEditedField('to');

      if (form.value.pool && value) {
        form.controls.fromAmount.patchValue(
          form.value.pool.calculateInputAmount(value),
          { emitEvent: 'silent' },
        );
      } else {
        form.controls.fromAmount.patchValue(undefined, { emitEvent: 'silent' });
      }
    },
  );

  useSubscription(
    form.controls.pool.valueChanges$,
    () => {
      const { fromAmount, toAmount, pool } = form.value;

      if (!pool) {
        return;
      }

      if (lastEditedField === 'from' && fromAmount && fromAmount.isPositive()) {
        form.controls.toAmount.patchValue(
          pool.calculateOutputAmount(fromAmount),
          { emitEvent: 'silent' },
        );
      }
      if (lastEditedField === 'to' && toAmount && toAmount.isPositive()) {
        form.controls.fromAmount.patchValue(
          pool.calculateInputAmount(toAmount),
          { emitEvent: 'silent' },
        );
      }
    },
    [lastEditedField],
  );

  const switchAssets = () => {
    form.patchValue(
      {
        fromAsset: form.value.toAsset,
        toAsset: form.value.fromAsset,
        fromAmount: form.value.toAmount,
        toAmount: form.value.fromAmount,
      },
      { emitEvent: 'silent' },
    );
    setLastEditedField((prev) => (prev === 'from' ? 'to' : 'from'));
  };

  const { t } = useTranslation();

  return (
    <ActionForm
      form={form}
      getInsufficientTokenNameForFee={getInsufficientTokenNameForFee}
      getInsufficientTokenNameForTx={getInsufficientTokenNameForTx}
      isLoading={isPoolLoading}
      getMinValueForToken={getMinValueForToken}
      isAmountNotEntered={isAmountNotEntered}
      isTokensNotSelected={isTokensNotSelected}
      isLiquidityInsufficient={isLiquidityInsufficient}
      isSwapLocked={isSwapLocked}
      action={submitSwap}
    >
      <Page
        width={504}
        footer={
          <Form.Item name="pool">
            {({ value, onChange }) => (
              <PoolSelector value={value} onChange={onChange} />
            )}
          </Form.Item>
        }
      >
        <Flex col>
          <Flex row align="center">
            <Flex.Item flex={1}>
              <Typography.Title level={4}>{t`swap.title`}</Typography.Title>
            </Flex.Item>
            <OperationSettings />
          </Flex>
          <Flex.Item marginBottom={1} marginTop={6}>
            <TokenControlFormItem
              bordered
              maxButton
              handleMaxButtonClick={handleMaxButtonClick}
              assets$={tokenAssets$}
              label={t`swap.fromLabel`}
              amountName="fromAmount"
              tokenName="fromAsset"
            />
          </Flex.Item>
          <SwitchButton
            onClick={switchAssets}
            icon={<SwapOutlined />}
            size="middle"
          />
          <Flex.Item>
            <TokenControlFormItem
              bordered
              assets$={toAssets$}
              label={t`swap.toLabel`}
              amountName="toAmount"
              tokenName="toAsset"
            />
          </Flex.Item>
          <Form.Listener>
            {({ value }) => (
              <Flex.Item marginTop={!!value.pool ? 4 : 0}>
                <SwapInfo value={value} />
              </Flex.Item>
            )}
          </Form.Listener>
          <Flex.Item marginTop={4}>
            <ActionForm.Button>Swap</ActionForm.Button>
          </Flex.Item>
        </Flex>
      </Page>
    </ActionForm>
  );
};
