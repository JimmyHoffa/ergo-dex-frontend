import './Logo.scss';

import React from 'react';

import { ReactComponent as LogoLabel } from '../../assets/images/logo-ergodex.svg';
import { ReactComponent as LogoIcon } from '../../assets/images/logoicon.svg';

export interface Props {
  label?: boolean;
}

export const Logo: React.FC<Props> = ({ label }) => {
  return (
    <div className="logo-wrapper">
      <LogoIcon />
      {label && <LogoLabel className="logo-label" />}
    </div>
  );
};