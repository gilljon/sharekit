import { type ReactNode, useCallback, useState } from "react";
import { Pressable, type StyleProp, Text, type TextStyle, type ViewStyle } from "react-native";
import { ShareManager } from "./share-manager.js";
import { ShareModal } from "./share-modal.js";

export interface ShareButtonProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  renderModal?: (props: { visible: boolean; onClose: () => void }) => ReactNode;
}

/**
 * Self-contained share button that opens the share modal on press.
 * Wraps itself in a ShareManager for state management.
 */
export function ShareButton({ label = "Share", style, textStyle, renderModal }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <Pressable style={style} onPress={() => setIsOpen(true)}>
        <Text style={textStyle}>{label}</Text>
      </Pressable>

      {isOpen && (
        <ShareManager>
          {renderModal ? (
            renderModal({ visible: isOpen, onClose: handleClose })
          ) : (
            <ShareModal visible={isOpen} onClose={handleClose} />
          )}
        </ShareManager>
      )}
    </>
  );
}
