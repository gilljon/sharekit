import { type ReactNode, useCallback, useState } from "react";
import { ShareManager } from "./share-manager.js";
import { ShareModal } from "./share-modal.js";

export interface ShareButtonProps {
  /** Custom label for the button */
  label?: string;
  /** Custom className for the button */
  className?: string;
  /** Custom modal content (receives close callback) */
  renderModal?: (props: { onClose: () => void }) => ReactNode;
}

/**
 * A self-contained share button that opens the share modal on click.
 * Wraps itself in a ShareManager for state management.
 */
export function ShareButton({ label = "Share", className, renderModal }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        type="button"
        data-shareable-trigger=""
        className={className}
        onClick={() => setIsOpen(true)}
      >
        {label}
      </button>

      {isOpen && (
        <ShareManager>
          <div data-shareable-overlay="" onClick={handleClose} onKeyDown={undefined}>
            <div
              data-shareable-dialog=""
              onClick={(e) => e.stopPropagation()}
              onKeyDown={undefined}
            >
              <button
                type="button"
                data-shareable-close=""
                onClick={handleClose}
                aria-label="Close"
              >
                &times;
              </button>
              {renderModal ? (
                renderModal({ onClose: handleClose })
              ) : (
                <ShareModal onClose={handleClose} />
              )}
            </div>
          </div>
        </ShareManager>
      )}
    </>
  );
}
