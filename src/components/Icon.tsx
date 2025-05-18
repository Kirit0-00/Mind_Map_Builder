import React, { ComponentType } from 'react';
import { IconType } from 'react-icons';
import { IconBaseProps } from 'react-icons/lib';

interface IconProps extends Omit<IconBaseProps, 'children'> {
  icon: IconType;
}

export const Icon: React.FC<IconProps> = ({ icon: IconComponent, ...props }) => {
  // Cast the IconComponent to a type that can be used in JSX
  const Component = IconComponent as ComponentType<IconBaseProps>;
  return <Component {...props} />;
};

Icon.displayName = 'Icon';

export default Icon; 