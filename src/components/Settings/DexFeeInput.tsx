import React, { useCallback, useState } from 'react';
import { Button, Input, useInput } from '@geist-ui/react';
import { DefaultSettings, Settings } from '../../context/SettingsContext';
import { AutoInputContainer } from './AutoInputContainer';
import { DexFeeMax, DexFeeMin } from '../../constants/settings';
import { FormError } from './FormError';

const content = {
  autoButton: 'Auto',
};

type DexFeeInputProps = {
  dexFee: string;
  updateSettings: (update: Partial<Settings>) => void;
};

export const DexFeeInput = (props: DexFeeInputProps): JSX.Element => {
  const { dexFee, updateSettings } = props;

  const [error, setError] = useState('');

  const isAuto = dexFee === DefaultSettings.dexFee;

  const { state, setState, bindings } = useInput(isAuto ? '' : dexFee);

  const handleChange = useCallback(
    (e?: React.ChangeEvent<HTMLInputElement>) => {
      if (e) {
        const value = e.target.value;

        setState(value);
        if (value) {
          const num = parseFloat(e.target.value);
          if (num >= DexFeeMin) {
            if (num > DexFeeMin && num <= DexFeeMax) {
              updateSettings({
                dexFee: num.toString(),
              });
              setError('');
            } else {
              setError(`must be >= ${DexFeeMin} and >= ${DexFeeMax}`);
            }
          } else {
            setError(`must be a number`);
          }
        }
      }
    },
    [updateSettings, setState],
  );

  const handleReset = useCallback(() => {
    updateSettings({
      dexFee: DefaultSettings.dexFee,
    });
    setState('');
    setError('');
  }, [updateSettings, setState]);

  const handleOnBlur = useCallback(() => {
    if (state === DefaultSettings.dexFee) {
      handleReset();
    }
  }, [state, handleReset]);

  return (
    <>
      <AutoInputContainer>
        <Button
          auto
          type={isAuto ? 'success' : undefined}
          onClick={handleReset}
        >
          {content.autoButton}
        </Button>
        <Input
          {...bindings}
          onClearClick={handleReset}
          onBlur={handleOnBlur}
          status={error ? 'error' : undefined}
          clearable
          labelRight="ERG"
          min={DexFeeMin}
          max={DexFeeMax}
          placeholder={DefaultSettings.dexFee}
          onChange={handleChange}
        />
      </AutoInputContainer>
      <FormError>{error}</FormError>
    </>
  );
};