import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, ClipboardList, Heart, Pencil, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { Button, Dialog, Input, Typography, useThemeColor } from 'heroui-native';
import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { ScoreBadge } from '@/components/ScoreBadge';
import { useFavorites, useScanStore, useScans } from '@/lib/store/scans';

export default function HistoryScreen() {
  const scans = useScans();
  const favorites = useFavorites();
  const removeScan = useScanStore((state) => state.removeScan);
  const renameScan = useScanStore((state) => state.renameScan);
  const toggleFavorite = useScanStore((state) => state.toggleFavorite);
  const [scanBeingRenamed, setScanBeingRenamed] = useState<string | null>(null);
  const [scanName, setScanName] = useState('');
  const [muted] = useThemeColor(['muted']);

  const beginRename = (scanId: string, currentName: string) => {
    setScanBeingRenamed(scanId);
    setScanName(currentName);
  };

  const closeRename = () => {
    setScanBeingRenamed(null);
    setScanName('');
  };

  const saveRename = () => {
    if (!scanBeingRenamed || !scanName.trim()) return;
    renameScan(scanBeingRenamed, scanName);
    closeRename();
  };

  if (scans.length === 0 && favorites.length === 0) {
    return (
      <View className="bg-background flex-1 justify-center">
        <EmptyState
          icon={ClipboardList}
          title="No menus yet"
          body="Once you check a menu it is kept here, on this phone, so you can look back at what you decided."
          actionLabel="Scan a menu"
          onAction={() => router.push('/(tabs)/scan')}
        />
      </View>
    );
  }

  return (
    <>
      <FlatList
        className="bg-background flex-1"
        data={scans}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-2 px-5 pt-3 pb-10"
        ListHeaderComponent={
          <View className="gap-3 pb-3">
            <Typography className="text-muted text-sm leading-6">
              Saved on this phone only. Scores reflect the profile used at the time.
            </Typography>
            {favorites.length > 0 ? (
              <View className="gap-2">
                <View className="flex-row items-center gap-2">
                  <Heart color={muted} size={16} />
                  <Typography className="text-base font-semibold">Favorite dishes</Typography>
                </View>
                {favorites.map((favorite) => {
                  const sourceStillSaved = scans.some((scan) => scan.id === favorite.scanId);
                  return (
                    <View
                      key={favorite.id}
                      className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4"
                    >
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({
                            pathname: '/favorite/[favoriteId]',
                            params: { favoriteId: favorite.id },
                          })
                        }
                        className="flex-1 flex-row items-center gap-3"
                      >
                        <ScoreBadge
                          score={favorite.dish.score}
                          band={favorite.dish.band}
                          size="sm"
                        />
                        <View className="flex-1 gap-0.5">
                          <Typography className="text-sm font-semibold" numberOfLines={1}>
                            {favorite.dish.dishName}
                          </Typography>
                          <Typography className="text-muted text-xs" numberOfLines={1}>
                            {favorite.place}
                            {sourceStillSaved ? '' : ' · saved snapshot'}
                          </Typography>
                        </View>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${favorite.dish.dishName} from favorites`}
                        onPress={() => toggleFavorite(favorite.scanId, favorite.lineId)}
                        className="bg-surface-secondary h-9 w-9 items-center justify-center rounded-full"
                      >
                        <Trash2 color={muted} size={15} />
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            ) : null}
            <Typography className="pt-2 text-base font-semibold">Previous menu scans</Typography>
          </View>
        }
        renderItem={({ item }) => {
          const best = item.analysis.dishes[0];
          const bestMatches = item.analysis.bestMatchLineIds.length;
          return (
            <View className="border-border bg-surface flex-row items-center gap-3 rounded-2xl border p-4">
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/results/[scanId]', params: { scanId: item.id } })
                }
                className="flex-1 flex-row items-center gap-3"
              >
                {best ? <ScoreBadge score={best.score} band={best.band} size="sm" /> : null}
                <View className="flex-1 gap-0.5">
                  <Typography className="text-sm font-semibold" numberOfLines={1}>
                    {item.place}
                  </Typography>
                  <Typography className="text-muted text-xs">
                    {item.analysis.dishes.length} dishes ·{' '}
                    {bestMatches > 0 ? `${bestMatches} good match` : 'no clear match'} ·{' '}
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </Typography>
                </View>
                <ChevronRight color={muted} size={18} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Rename the menu from ${item.place}`}
                onPress={() => beginRename(item.id, item.place)}
                className="bg-surface-secondary h-9 w-9 items-center justify-center rounded-full"
              >
                <Pencil color={muted} size={15} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete the menu from ${item.place}`}
                onPress={() => removeScan(item.id)}
                className="bg-surface-secondary h-9 w-9 items-center justify-center rounded-full"
              >
                <Trash2 color={muted} size={15} />
              </Pressable>
            </View>
          );
        }}
      />

      <Dialog
        isOpen={scanBeingRenamed !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) closeRename();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <KeyboardAvoidingView
            behavior={
              Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined
            }
            className="flex-1 justify-center"
            pointerEvents="box-none"
          >
            <Dialog.Content isSwipeable={false}>
              <Dialog.Close variant="ghost" />
              <View className="mb-5 gap-1.5">
                <Dialog.Title>Name this menu</Dialog.Title>
                <Dialog.Description>
                  Use a name you will recognise, such as the restaurant name.
                </Dialog.Description>
              </View>

              <Input
                autoCorrect={false}
                maxLength={60}
                onChangeText={setScanName}
                onSubmitEditing={saveRename}
                placeholder="Restaurant or menu name"
                returnKeyType="done"
                value={scanName}
              />

              <View className="mt-5 flex-row justify-end gap-3">
                <Button variant="ghost" size="sm" onPress={closeRename}>
                  Cancel
                </Button>
                <Button size="sm" isDisabled={!scanName.trim()} onPress={saveRename}>
                  Save
                </Button>
              </View>
            </Dialog.Content>
          </KeyboardAvoidingView>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
