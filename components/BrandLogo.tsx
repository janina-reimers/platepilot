import { Image } from 'expo-image';
import { View } from 'react-native';
import platePilotLogo from '@/assets/PlatePilot_Logo.png';

type BrandLogoProps = {
  size?: number;
};

export function BrandLogo({ size = 168 }: BrandLogoProps) {
  const logoAspectRatio = 1434 / 1011;
  const frameHeight = size / logoAspectRatio;
  const inset = 4;
  const imageWidth = size - inset * 2;
  const imageHeight = imageWidth / logoAspectRatio;

  return (
    <View
      className="border-ink items-center justify-center overflow-hidden rounded-3xl"
      style={{ width: size, height: frameHeight, borderWidth: 3 }}
    >
      <Image
        accessibilityLabel="PlatePilot"
        source={platePilotLogo}
        contentFit="contain"
        style={{ width: imageWidth, height: imageHeight }}
      />
    </View>
  );
}
