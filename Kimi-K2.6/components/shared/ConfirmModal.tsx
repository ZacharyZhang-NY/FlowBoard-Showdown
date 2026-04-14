"use client";

import { ComposedModal, ModalHeader, ModalBody, ModalFooter, Button } from "@carbon/react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  danger = false,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <ComposedModal open={open} onClose={onClose}>
      <ModalHeader label="Confirmation" title={title} />
      <ModalBody>
        <p>{message}</p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button kind={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmText}
        </Button>
      </ModalFooter>
    </ComposedModal>
  );
}
