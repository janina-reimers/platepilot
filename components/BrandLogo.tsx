import { Image } from 'expo-image';
import { View } from 'react-native';
import platePilotLogo from '@/assets/PlatePilot_Logo.png';

type BrandLogoProps = {
  size?: number;
};

export function BrandLogo({ size = 168 }: BrandLogoProps) {
  const imageSize = size - 4;

  return (
    <View
      className="border-ink items-center justify-center overflow-hidden rounded-3xl border-2"
      style={{ width: size, height: size }}
    >
      <Image
        accessibilityLabel="PlatePilot"
        source={platePilotLogo}
        contentFit="contain"
        style={{ width: imageSize, height: imageSize }}
      />
    </View>
  );
}
