import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function Header({ children }: PropsWithChildren) {
  return <View>{children}</View>;
}
