import * as ImagePicker from 'expo-image-picker';

export type CapturedPhoto = {
  uri: string;
  width?: number;
  height?: number;
};

export type CaptureOutcome = {
  photo?: CapturedPhoto;
  /** A sentence to show the user. Absent when they simply backed out. */
  error?: string;
};

function fromResult(result: ImagePicker.ImagePickerResult): CaptureOutcome {
  if (result.canceled) return {};
  const asset = result.assets[0];
  if (!asset) return {};
  return { photo: { uri: asset.uri, width: asset.width, height: asset.height } };
}

/** Open the camera for a menu photo. */
export async function takeMenuPhoto(): Promise<CaptureOutcome> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return {
        error:
          'PlatePilot needs camera access to photograph a menu. You can also upload a picture you already have.',
      };
    }
    return fromResult(await ImagePicker.launchCameraAsync({ quality: 0.8 }));
  } catch {
    return { error: 'The camera could not be opened. Try uploading a picture instead.' };
  }
}

/** Pick an existing picture of a menu. */
export async function pickMenuPhoto(): Promise<CaptureOutcome> {
  try {
    return fromResult(
      await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 }),
    );
  } catch {
    return { error: 'That picture could not be opened. Try another one.' };
  }
}
