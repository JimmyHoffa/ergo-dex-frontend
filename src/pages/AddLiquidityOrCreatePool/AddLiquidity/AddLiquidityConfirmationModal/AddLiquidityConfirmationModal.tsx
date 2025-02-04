import { minValueForOrder } from '@ergolabs/ergo-dex-sdk';
import { BoxSelection, DefaultBoxSelector, ErgoTx } from '@ergolabs/ergo-sdk';
import React, { FC } from 'react';

import { ERG_DECIMALS, UI_FEE } from '../../../../common/constants/erg';
import { useObservable } from '../../../../common/hooks/useObservable';
import { FormPairSection } from '../../../../components/common/FormView/FormPairSection/FormPairSection';
import { InfoTooltip } from '../../../../components/InfoTooltip/InfoTooltip';
import { PageSection } from '../../../../components/Page/PageSection/PageSection';
import { Section } from '../../../../components/Section/Section';
import { useSettings } from '../../../../context';
import { Button, Flex, Modal, Typography } from '../../../../ergodex-cdk';
import { utxos$ } from '../../../../network/ergo/common/utxos';
import { explorer } from '../../../../services/explorer';
import { useMinExFee, useMinTotalFees } from '../../../../services/new/core';
import { poolActions } from '../../../../services/poolActions';
import { submitTx } from '../../../../services/yoroi';
import { makeTarget } from '../../../../utils/ammMath';
import { parseUserInputToFractions } from '../../../../utils/math';
import { PoolRatio } from '../../../PoolOverview/PoolRatio/PoolRatio';
import { AddLiquidityFormModel } from '../AddLiquidityFormModel';

interface AddLiquidityConfirmationModalProps {
  value: Required<AddLiquidityFormModel>;
  onClose: (r: Promise<any>) => void;
}

const AddLiquidityConfirmationModal: FC<AddLiquidityConfirmationModalProps> = ({
  value,
  onClose,
}) => {
  const [{ minerFee, address, pk }] = useSettings();
  const [utxos] = useObservable(utxos$);
  const totalFees = useMinTotalFees();
  const minExFee = useMinExFee();

  const uiFeeNErg = parseUserInputToFractions(UI_FEE, ERG_DECIMALS);
  const exFeeNErg = minExFee.amount;
  const minerFeeNErgs = parseUserInputToFractions(minerFee, ERG_DECIMALS);

  const addLiquidityOperation = async () => {
    const { pool, y, x } = value;

    if (pool && pk && address && utxos) {
      const poolId = pool.id;

      const actions = poolActions(pool['pool']);

      const inputX = pool['pool'].x.withAmount(
        x.asset.id === pool.x.asset.id ? x.amount : y.amount,
      );
      const inputY = pool['pool'].y.withAmount(
        y.asset.id === pool.y.asset.id ? y.amount : x.amount,
      );

      const target = makeTarget(
        [inputX, inputY],
        minValueForOrder(minerFeeNErgs, uiFeeNErg, exFeeNErg),
      );

      const network = await explorer.getNetworkContext();

      const inputs = DefaultBoxSelector.select(utxos, target) as BoxSelection;

      onClose(
        actions
          .deposit(
            {
              pk,
              poolId,
              exFee: exFeeNErg,
              uiFee: uiFeeNErg,
              x: inputX,
              y: inputY,
            },
            {
              inputs,
              changeAddress: address,
              selfAddress: address,
              feeNErgs: minerFeeNErgs,
              network,
            },
          )
          .then((tx: ErgoTx) => submitTx(tx)),
      );
    }
  };

  return (
    <>
      <Modal.Title>Confirm Add Liquidity</Modal.Title>
      <Modal.Content width={436}>
        <Flex direction="col">
          <Flex.Item marginBottom={6}>
            <FormPairSection
              title="Assets"
              xAmount={value.x}
              yAmount={value.y}
            />
          </Flex.Item>
          <Flex.Item marginBottom={6}>
            <Section title="Initial price">
              <Flex>
                <Flex.Item flex={1} marginRight={2}>
                  <PoolRatio ammPool={value.pool} ratioOf="x" />
                </Flex.Item>
                <Flex.Item flex={1}>
                  <PoolRatio ammPool={value.pool} ratioOf="y" />
                </Flex.Item>
              </Flex>
            </Section>
          </Flex.Item>
          <Flex.Item marginBottom={6}>
            <PageSection title="Fees">
              <Flex justify="space-between">
                <Flex.Item>
                  <Typography.Text strong>Fees</Typography.Text>
                  <InfoTooltip
                    placement="rightBottom"
                    content={
                      <Flex direction="col">
                        <Flex.Item>
                          <Flex>
                            <Flex.Item marginRight={1}>Miner Fee:</Flex.Item>
                            <Flex.Item>{minerFee} ERG</Flex.Item>
                          </Flex>
                        </Flex.Item>
                        <Flex.Item>
                          <Flex>
                            <Flex.Item marginRight={1}>
                              Execution Fee:
                            </Flex.Item>
                            <Flex.Item>{minExFee.toCurrencyString()}</Flex.Item>
                          </Flex>
                        </Flex.Item>

                        {!!UI_FEE && (
                          <Flex.Item>
                            <Flex>
                              <Flex.Item marginRight={1}>UI Fee:</Flex.Item>
                              <Flex.Item>{UI_FEE} ERG</Flex.Item>
                            </Flex>
                          </Flex.Item>
                        )}
                      </Flex>
                    }
                  />
                </Flex.Item>
                <Flex.Item>
                  <Typography.Text strong>
                    {totalFees.toCurrencyString()}
                  </Typography.Text>
                </Flex.Item>
              </Flex>
            </PageSection>
          </Flex.Item>
          <Flex.Item>
            <Button
              block
              type="primary"
              size="extra-large"
              onClick={() => addLiquidityOperation()}
            >
              Add Liquidity
            </Button>
          </Flex.Item>
        </Flex>
      </Modal.Content>
    </>
  );
};

export { AddLiquidityConfirmationModal };
