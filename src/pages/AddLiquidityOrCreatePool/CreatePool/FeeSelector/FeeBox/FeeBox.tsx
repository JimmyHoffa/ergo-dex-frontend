import React, { FC, ReactNode } from 'react';
import styled from 'styled-components';

import { ReactComponent as CheckedIcon } from '../../../../../assets/icons/checked-icon.svg';
import { Box, Flex, Typography } from '../../../../../ergodex-cdk';

interface FeeBoxProps {
  readonly className?: string;
  readonly active?: boolean;
  readonly onClick?: () => void;
  readonly description?: ReactNode | ReactNode[] | string;
  readonly content?: ReactNode | ReactNode[] | string;
}

const _ActiveIcon: FC<{ className?: string }> = ({ className }) => (
  <CheckedIcon className={className} />
);

const ActiveIcon = styled(_ActiveIcon)`
  position: absolute;
  top: 0;
  right: 0;
  color: var(--ergo-primary-color);
  transform: translate(50%, -50%);
`;

const _FeeBox: FC<FeeBoxProps> = ({
  className,
  content,
  description,
  active,
  onClick,
}) => (
  <Box className={className} padding={[0, 3]} onClick={onClick}>
    {active && <ActiveIcon />}
    <Flex col justify="center" stretch>
      <Flex.Item marginBottom={1}>
        <Typography.Body strong>{content}</Typography.Body>
      </Flex.Item>
      <Typography.Footnote>{description}</Typography.Footnote>
    </Flex>
  </Box>
);

export const FeeBox = styled(_FeeBox)`
  background: var(--ergo-pool-position-bg);
  cursor: pointer;
  height: 90px;
  position: relative;

  &:hover {
    border-color: var(--ergo-primary-color);
  }

  ${(props) => props.active && 'border-color: var(--ergo-primary-color)'}
`;
