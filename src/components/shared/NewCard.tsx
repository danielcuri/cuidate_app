import React, { PropsWithChildren } from 'react';
import { View } from 'react-native';

export function NewCard({ children }: PropsWithChildren) {
  return <View>{children}</View>;
}
