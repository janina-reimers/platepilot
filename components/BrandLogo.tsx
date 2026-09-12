import { Image } from 'expo-image';
import platePilotLogo from '@/assets/PlatePilot_Logo.png';

type BrandLogoProps = {
  size?: number;
};

export function BrandLogo({ size = 168 }: BrandLogoProps) {
  return (
    <Image
      accessibilityLabel="PlatePilot"
      source={platePilotLogo}
      contentFit="contain"
      style={{ width: size, height: size }}
    />
  );
}
